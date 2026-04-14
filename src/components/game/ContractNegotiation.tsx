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

export default function ContractNegotiation({ open, onClose }: ContractNegotiationProps): React.JSX.Element {
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

  // Can the player negotiate? (<= 2 years remaining)
  const canNegotiate = useMemo(() => {
    if (!gameState) return false;
    return gameState.player.contract.yearsRemaining <= 2;
  }, [gameState]);

  // Computed: wage progression data points (4 years)
  const wageProgressionData = useMemo(() => {
    if (!gameState) return [];
    const base = gameState.player.contract.weeklyWage;
    const growthRate = 1.0 + (gameState.player.age <= 26 ? 0.08 : gameState.player.age <= 30 ? 0.04 : 0.01);
    return [
      { year: 'Y1', wage: base },
      { year: 'Y2', wage: Math.round(base * growthRate * 10) / 10 },
      { year: 'Y3', wage: Math.round(base * growthRate * growthRate * 10) / 10 },
      { year: 'Y4', wage: Math.round(base * growthRate * growthRate * growthRate * 10) / 10 },
    ];
  }, [gameState]);

  // Computed: negotiation leverage score (0-100)
  const leverageScore = useMemo(() => {
    if (!gameState) return 50;
    const p = gameState.player;
    let score = 50;
    score += (p.overall - 70) * 0.5;
    score += (p.reputation - 50) * 0.3;
    if (p.squadStatus === 'starter') score += 15;
    else if (p.squadStatus === 'rotation') score += 5;
    if (p.contract.yearsRemaining <= 1) score -= 10;
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [gameState]);

  // Computed: club budget allocation segments
  const budgetAllocation = useMemo(() => {
    if (!gameState) return [];
    const fin = Math.max(1, gameState.currentClub.finances);
    return [
      { label: 'Wages', value: 55, color: '#34d399' },
      { label: 'Transfers', value: Math.round(fin * 0.25), color: '#60a5fa' },
      { label: 'Facilities', value: Math.round(fin * 0.12), color: '#fbbf24' },
      { label: 'Youth', value: Math.round(fin * 0.08), color: '#c084fc' },
    ];
  }, [gameState]);

  // Computed: market value comparison bars
  const marketComparisons = useMemo(() => {
    if (!gameState) return [];
    const mv = gameState.player.marketValue;
    return [
      { label: 'You', value: mv, color: '#34d399' },
      { label: 'League Avg', value: Math.round(mv * 0.75 * 100) / 100, color: '#60a5fa' },
      { label: 'Position Avg', value: Math.round(mv * 0.9 * 100) / 100, color: '#c084fc' },
      { label: 'Club Budget', value: Math.round(mv * 1.8 * 100) / 100, color: '#fbbf24' },
    ];
  }, [gameState]);

  // Computed: radar chart data (current vs new offer)
  const radarData = useMemo(() => {
    if (!gameState || !currentClubOffer) return { current: [0,0,0,0,0,0], offered: [0,0,0,0,0,0] };
    const curr = gameState.player.contract;
    const maxWage = Math.max(curr.weeklyWage, currentClubOffer.weeklyWage, 1);
    const maxLength = Math.max(curr.yearsRemaining, currentClubOffer.yearsRemaining, 1);
    const maxBonus = Math.max(
      curr.signingBonus ?? 0,
      currentClubOffer.signingBonus ?? 0,
      1
    );
    const maxRelease = Math.max(
      curr.releaseClause ?? 0,
      currentClubOffer.releaseClause ?? 0,
      1
    );
    return {
      current: [
        curr.weeklyWage / maxWage * 100,
        curr.yearsRemaining / maxLength * 100,
        (curr.signingBonus ?? 0) / maxBonus * 100,
        (curr.releaseClause ?? 0) / maxRelease * 100,
        40,
        70,
      ],
      offered: [
        currentClubOffer.weeklyWage / maxWage * 100,
        currentClubOffer.yearsRemaining / maxLength * 100,
        currentClubOffer.signingBonus / maxBonus * 100,
        (currentClubOffer.releaseClause ?? 0) / maxRelease * 100,
        65,
        55,
      ],
    };
  }, [gameState, currentClubOffer]);

  // Computed: negotiation quality score
  const negotiationQuality = useMemo(() => {
    if (!outcome) return 0;
    if (outcome === 'accepted') return 90;
    if (outcome === 'counter_accepted') return 75 + currentRound * 5;
    if (outcome === 'rejected_by_player') return 30;
    return 15;
  }, [outcome, currentRound]);

  // Computed: peer wages for market comparison
  const peerWages = useMemo(() => {
    if (!gameState || !finalOffer) return [];
    const pw = finalOffer.weeklyWage;
    return [
      { name: 'Peer A', wage: Math.round(pw * 1.3 * 10) / 10 },
      { name: 'Peer B', wage: Math.round(pw * 0.95 * 10) / 10 },
      { name: 'You', wage: pw, isPlayer: true },
      { name: 'Peer C', wage: Math.round(pw * 0.8 * 10) / 10 },
      { name: 'Peer D', wage: Math.round(pw * 0.65 * 10) / 10 },
    ];
  }, [gameState, finalOffer]);

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

  if (!gameState || !canNegotiate) return null as unknown as React.JSX.Element;

  const { player, currentClub } = gameState;

  // --- SVG helper values derived once ---
  const svgChartPadding = 8;
  const svgChartWidth = 260;
  const svgChartHeight = 120;

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

              {/* ===== SVG #1: Wage Progression Chart ===== */}
              {wageProgressionData.length > 0 && (
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Wage Progression</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <svg viewBox={`0 0 ${svgChartWidth + svgChartPadding * 2} ${svgChartHeight + svgChartPadding * 2}`} style={{ width: '100%', maxWidth: 280 }}>
                      {(() => {
                        const maxVal = Math.max(...wageProgressionData.map(d => d.wage), 1);
                        const plotW = svgChartWidth;
                        const plotH = svgChartHeight;
                        const stepX = plotW / (wageProgressionData.length - 1);
                        return (
                          <>
                            {/* Grid lines */}
                            {[0, 1, 2, 3, 4].map(gi => (
                              <line
                                key={`grid-${gi}`}
                                x1={svgChartPadding}
                                y1={svgChartPadding + (plotH / 4) * gi}
                                x2={svgChartPadding + plotW}
                                y2={svgChartPadding + (plotH / 4) * gi}
                                stroke="#21262d"
                                strokeWidth={1}
                              />
                            ))}
                            {/* Data line */}
                            <polyline
                              fill="none"
                              stroke="#34d399"
                              strokeWidth={2}
                              points={wageProgressionData.map((d, i) =>
                                `${svgChartPadding + i * stepX},${svgChartPadding + plotH - (d.wage / maxVal) * plotH}`
                              ).join(' ')}
                            />
                            {/* Data points */}
                            {wageProgressionData.map((d, i) => (
                              <circle
                                key={`dot-${i}`}
                                cx={svgChartPadding + i * stepX}
                                cy={svgChartPadding + plotH - (d.wage / maxVal) * plotH}
                                r={4}
                                fill="#34d399"
                                stroke="#0d1117"
                                strokeWidth={2}
                              />
                            ))}
                            {/* Labels */}
                            {wageProgressionData.map((d, i) => (
                              <text
                                key={`label-${i}`}
                                x={svgChartPadding + i * stepX}
                                y={svgChartHeight + svgChartPadding * 2 - 2}
                                textAnchor="middle"
                                fill="#8b949e"
                                fontSize={9}
                              >
                                {d.year}
                              </text>
                            ))}
                            {/* Value labels */}
                            {wageProgressionData.map((d, i) => (
                              <text
                                key={`val-${i}`}
                                x={svgChartPadding + i * stepX}
                                y={svgChartPadding + plotH - (d.wage / maxVal) * plotH - 8}
                                textAnchor="middle"
                                fill="#c9d1d9"
                                fontSize={8}
                              >
                                {formatCurrency(d.wage, 'K')}
                              </text>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </CardContent>
                </Card>
              )}

              {/* ===== SVG #2: Negotiation Leverage Gauge ===== */}
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Negotiation Leverage</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 flex flex-col items-center">
                  <svg viewBox="0 0 200 120" style={{ width: '100%', maxWidth: 220 }}>
                    {(() => {
                      const cx = 100;
                      const cy = 100;
                      const radius = 80;
                      const angle = Math.PI;
                      const leverVal = leverageScore;
                      const leverAngle = angle * (leverVal / 100);
                      // Red segment: 0-33
                      const redEnd = angle * 0.33;
                      const amberEnd = angle * 0.66;
                      // Arc helper for SVG arc path
                      const arcPath = (startA: number, endA: number) => {
                        const x1 = cx + radius * Math.cos(Math.PI - startA);
                        const y1 = cy - radius * Math.sin(Math.PI - startA);
                        const x2 = cx + radius * Math.cos(Math.PI - endA);
                        const y2 = cy - radius * Math.sin(Math.PI - endA);
                        const large = endA - startA > Math.PI ? 1 : 0;
                        return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
                      };
                      return (
                        <>
                          {/* Background track */}
                          <path
                            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                            fill="none"
                            stroke="#21262d"
                            strokeWidth={12}
                          />
                          {/* Red segment (0-33) */}
                          <path d={arcPath(0, Math.min(redEnd, leverAngle))} fill="#ef4444" fillOpacity={0.2} stroke="#ef4444" strokeWidth={1} />
                          {/* Amber segment (33-66) */}
                          {leverAngle > redEnd && (
                            <path d={arcPath(redEnd, Math.min(amberEnd, leverAngle))} fill="#f59e0b" fillOpacity={0.2} stroke="#f59e0b" strokeWidth={1} />
                          )}
                          {/* Green segment (66-100) */}
                          {leverAngle > amberEnd && (
                            <path d={arcPath(amberEnd, leverAngle)} fill="#34d399" fillOpacity={0.2} stroke="#34d399" strokeWidth={1} />
                          )}
                          {/* Needle */}
                          {(() => {
                            const needleAngle = Math.PI - leverAngle;
                            const nx = cx + (radius - 15) * Math.cos(needleAngle);
                            const ny = cy - (radius - 15) * Math.sin(needleAngle);
                            return (
                              <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#c9d1d9" strokeWidth={2} />
                            );
                          })()}
                          {/* Center dot */}
                          <circle cx={cx} cy={cy} r={6} fill="#21262d" stroke="#c9d1d9" strokeWidth={2} />
                          {/* Score text */}
                          <text x={cx} y={cy - 18} textAnchor="middle" fill="#c9d1d9" fontSize={18} fontWeight="bold">{leverVal}</text>
                          {/* Min/Max labels */}
                          <text x={cx - radius + 5} y={cy + 16} textAnchor="start" fill="#8b949e" fontSize={8}>Weak</text>
                          <text x={cx + radius - 5} y={cy + 16} textAnchor="end" fill="#8b949e" fontSize={8}>Strong</text>
                        </>
                      );
                    })()}
                  </svg>
                </CardContent>
              </Card>

              {/* ===== SVG #3: Club Budget Allocation Donut ===== */}
              {budgetAllocation.length > 0 && (
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Club Budget Allocation</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <div className="flex items-center gap-4">
                      <svg viewBox="0 0 120 120" style={{ width: 90, height: 90, flexShrink: 0 }}>
                        {(() => {
                          const cx = 60;
                          const cy = 60;
                          const outerR = 50;
                          const innerR = 30;
                          const total = budgetAllocation.reduce((sum, seg) => sum + seg.value, 0) || 1;
                          const donutPaths = budgetAllocation.reduce<{ accAngle: number; paths: Array<{ key: number; d: string; color: string }> }>(
                            (acc, seg, idx) => {
                              const segAngle = (seg.value / total) * Math.PI * 2;
                              const startAngle = acc.accAngle;
                              const endAngle = acc.accAngle + segAngle;
                              const x1o = cx + outerR * Math.cos(startAngle);
                              const y1o = cy + outerR * Math.sin(startAngle);
                              const x2o = cx + outerR * Math.cos(endAngle);
                              const y2o = cy + outerR * Math.sin(endAngle);
                              const x1i = cx + innerR * Math.cos(endAngle);
                              const y1i = cy + innerR * Math.sin(endAngle);
                              const x2i = cx + innerR * Math.cos(startAngle);
                              const y2i = cy + innerR * Math.sin(startAngle);
                              const large = segAngle > Math.PI ? 1 : 0;
                              const path = `M ${x1o} ${y1o} A ${outerR} ${outerR} 0 ${large} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${innerR} ${innerR} 0 ${large} 0 ${x2i} ${y2i} Z`;
                              return { accAngle: endAngle, paths: [...acc.paths, { key: idx, d: path, color: seg.color }] };
                            },
                            { accAngle: -Math.PI / 2, paths: [] }
                          );
                          return (
                            <>
                              {donutPaths.paths.map((p) => (
                                <path key={p.key} d={p.d} fill={p.color} fillOpacity={0.8} />
                              ))}
                              {/* Center label */}
                              <text x={cx} y={cy - 4} textAnchor="middle" fill="#c9d1d9" fontSize={11} fontWeight="bold">Budget</text>
                              <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize={8}>{currentClub.finances}/100</text>
                            </>
                          );
                        })()}
                      </svg>
                      {/* Legend */}
                      <div className="flex flex-col gap-1.5">
                        {budgetAllocation.map((seg, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
                            <span className="text-[10px] text-[#8b949e]">{seg.label}</span>
                            <span className="text-[10px] text-[#c9d1d9] font-semibold">{seg.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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

              {/* ===== SVG #5: Negotiation Round Timeline ===== */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                <svg viewBox="0 0 280 50" style={{ width: '100%' }}>
                  {[1, 2, 3].map(r => {
                    const xPos = 40 + (r - 1) * 100;
                    const isCompleted = r < currentRound;
                    const isCurrent = r === currentRound;
                    const dotColor = isCompleted ? '#34d399' : isCurrent ? '#f59e0b' : '#30363d';
                    const lineColor = r < 3 ? (r < currentRound ? '#34d399' : '#30363d') : '#30363d';
                    return (
                      <g key={`round-${r}`}>
                        {/* Connecting line */}
                        {r < 3 && (
                          <line
                            x1={xPos + 14}
                            y1={22}
                            x2={xPos + 86}
                            y2={22}
                            stroke={lineColor}
                            strokeWidth={2}
                          />
                        )}
                        {/* Circle */}
                        <circle cx={xPos} cy={22} r={12} fill={dotColor} fillOpacity={isCompleted || isCurrent ? 0.2 : 0.1} stroke={dotColor} strokeWidth={2} />
                        {/* Status icon */}
                        {isCompleted && (
                          <text x={xPos} y={26} textAnchor="middle" fill="#34d399" fontSize={11} fontWeight="bold">&#10003;</text>
                        )}
                        {isCurrent && (
                          <circle cx={xPos} cy={22} r={4} fill="#f59e0b" />
                        )}
                        {!isCompleted && !isCurrent && (
                          <circle cx={xPos} cy={22} r={3} fill="#30363d" />
                        )}
                        {/* Label */}
                        <text x={xPos} y={44} textAnchor="middle" fill={isCurrent ? '#f59e0b' : '#8b949e'} fontSize={9}>
                          Round {r}
                        </text>
                      </g>
                    );
                  })}
                </svg>
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

              {/* ===== SVG #4: Market Value Comparison Bars ===== */}
              {marketComparisons.length > 0 && (
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Market Value Comparison</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <svg viewBox="0 0 280 100" style={{ width: '100%' }}>
                      {(() => {
                        const barMaxW = 160;
                        const maxVal = Math.max(...marketComparisons.map(c => c.value), 1);
                        return marketComparisons.map((comp, idx) => {
                          const barW = Math.max(4, (comp.value / maxVal) * barMaxW);
                          const yPos = 12 + idx * 22;
                          return (
                            <g key={`bar-${idx}`}>
                              {/* Label */}
                              <text x={0} y={yPos + 11} fill="#8b949e" fontSize={9}>{comp.label}</text>
                              {/* Bar background */}
                              <rect x={70} y={yPos} width={barMaxW} height={14} rx={3} fill="#21262d" />
                              {/* Bar fill */}
                              <rect x={70} y={yPos} width={barW} height={14} rx={3} fill={comp.color} fillOpacity={0.8} />
                              {/* Value */}
                              <text x={70 + barMaxW + 6} y={yPos + 11} fill="#c9d1d9" fontSize={9}>
                                {formatCurrency(comp.value, 'M')}
                              </text>
                            </g>
                          );
                        });
                      })()}
                    </svg>
                  </CardContent>
                </Card>
              )}

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
                  Reject &amp; Walk Away
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

              {/* ===== SVG #5 (also shown in counter): Negotiation Round Timeline ===== */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                <svg viewBox="0 0 280 50" style={{ width: '100%' }}>
                  {[1, 2, 3].map(r => {
                    const xPos = 40 + (r - 1) * 100;
                    const isCompleted = r < currentRound;
                    const isCurrent = r === currentRound;
                    const dotColor = isCompleted ? '#34d399' : isCurrent ? '#f59e0b' : '#30363d';
                    const lineColor = r < 3 ? (r < currentRound ? '#34d399' : '#30363d') : '#30363d';
                    return (
                      <g key={`counter-round-${r}`}>
                        {r < 3 && (
                          <line x1={xPos + 14} y1={22} x2={xPos + 86} y2={22} stroke={lineColor} strokeWidth={2} />
                        )}
                        <circle cx={xPos} cy={22} r={12} fill={dotColor} fillOpacity={isCompleted || isCurrent ? 0.2 : 0.1} stroke={dotColor} strokeWidth={2} />
                        {isCompleted && (
                          <text x={xPos} y={26} textAnchor="middle" fill="#34d399" fontSize={11} fontWeight="bold">&#10003;</text>
                        )}
                        {isCurrent && (
                          <circle cx={xPos} cy={22} r={4} fill="#f59e0b" />
                        )}
                        {!isCompleted && !isCurrent && (
                          <circle cx={xPos} cy={22} r={3} fill="#30363d" />
                        )}
                        <text x={xPos} y={44} textAnchor="middle" fill={isCurrent ? '#f59e0b' : '#8b949e'} fontSize={9}>
                          Round {r}
                        </text>
                      </g>
                    );
                  })}
                </svg>
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

                  {/* ===== SVG #6: Wage Demand Spectrum ===== */}
                  <div>
                    <span className="text-[10px] text-[#8b949e] uppercase tracking-wider block mb-1.5">Demand Spectrum</span>
                    <svg viewBox="0 0 260 36" style={{ width: '100%' }}>
                      {(() => {
                        const barX = 0;
                        const barY = 6;
                        const barW = 260;
                        const barH = 14;
                        const range = wageMax - wageMin || 1;
                        const minPct = 0;
                        const currentPct = (player.contract.weeklyWage - wageMin) / range;
                        const offerPct = (currentClubOffer.weeklyWage - wageMin) / range;
                        const demandPct = (counterWage - wageMin) / range;
                        const maxPct = 1;
                        return (
                          <>
                            {/* Background zones */}
                            <rect x={barX} y={barY} width={barW * 0.25} height={barH} rx={3} fill="#ef4444" fillOpacity={0.2} />
                            <rect x={barX + barW * 0.25} y={barY} width={barW * 0.25} height={barH} rx={0} fill="#f59e0b" fillOpacity={0.2} />
                            <rect x={barX + barW * 0.5} y={barY} width={barW * 0.25} height={barH} rx={0} fill="#34d399" fillOpacity={0.15} />
                            <rect x={barX + barW * 0.75} y={barY} width={barW * 0.25} height={barH} rx={3} fill="#ef4444" fillOpacity={0.15} />
                            {/* Current wage marker */}
                            <line x1={barX + barW * currentPct} y1={barY - 2} x2={barX + barW * currentPct} y2={barY + barH + 2} stroke="#8b949e" strokeWidth={2} />
                            <text x={barX + barW * currentPct} y={barY - 4} textAnchor="middle" fill="#8b949e" fontSize={7}>Current</text>
                            {/* Club offer marker */}
                            <line x1={barX + barW * offerPct} y1={barY - 2} x2={barX + barW * offerPct} y2={barY + barH + 2} stroke="#34d399" strokeWidth={2} />
                            <text x={barX + barW * offerPct} y={barY + barH + 12} textAnchor="middle" fill="#34d399" fontSize={7}>Offer</text>
                            {/* Demand marker */}
                            <line x1={barX + barW * demandPct} y1={barY - 2} x2={barX + barW * demandPct} y2={barY + barH + 2} stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 2" />
                            <text x={barX + barW * demandPct} y={barY - 4} textAnchor="middle" fill="#f59e0b" fontSize={7}>Demand</text>
                            {/* Labels */}
                            <text x={barX} y={barY + barH + 12} textAnchor="start" fill="#484f58" fontSize={7}>{formatCurrency(wageMin, 'K')}</text>
                            <text x={barX + barW} y={barY + barH + 12} textAnchor="end" fill="#484f58" fontSize={7}>{formatCurrency(wageMax, 'K')}</text>
                          </>
                        );
                      })()}
                    </svg>
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

              {/* ===== SVG #7: Offer Comparison Radar ===== */}
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Offer Comparison</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 flex flex-col items-center">
                  <svg viewBox="0 0 220 200" style={{ width: '100%', maxWidth: 220 }}>
                    {(() => {
                      const cx = 110;
                      const cy = 95;
                      const maxR = 75;
                      const axes = ['Wage', 'Length', 'Bonus', 'Release', 'Bonuses', 'Security'];
                      const n = axes.length;
                      const angleStep = (Math.PI * 2) / n;
                      const currentVals = radarData.current;
                      const offeredVals = radarData.offered;

                      const getPoint = (axisIdx: number, val: number) => {
                        const angle = -Math.PI / 2 + axisIdx * angleStep;
                        const r = (val / 100) * maxR;
                        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
                      };

                      return (
                        <>
                          {/* Grid rings */}
                          {[20, 40, 60, 80, 100].map(ringPct => {
                            const rr = (ringPct / 100) * maxR;
                            const pts = axes.map((_, ai) => {
                              const a = -Math.PI / 2 + ai * angleStep;
                              return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
                            }).join(' ');
                            return <polygon key={`ring-${ringPct}`} points={pts} fill="none" stroke="#21262d" strokeWidth={1} />;
                          })}
                          {/* Axis lines */}
                          {axes.map((_, ai) => {
                            const a = -Math.PI / 2 + ai * angleStep;
                            return (
                              <line key={`axis-${ai}`} x1={cx} y1={cy} x2={cx + maxR * Math.cos(a)} y2={cy + maxR * Math.sin(a)} stroke="#21262d" strokeWidth={1} />
                            );
                          })}
                          {/* Axis labels */}
                          {axes.map((label, ai) => {
                            const a = -Math.PI / 2 + ai * angleStep;
                            const lx = cx + (maxR + 16) * Math.cos(a);
                            const ly = cy + (maxR + 16) * Math.sin(a);
                            return (
                              <text key={`axis-label-${ai}`} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="#8b949e" fontSize={8}>
                                {label}
                              </text>
                            );
                          })}
                          {/* Current contract polygon */}
                          <polygon
                            points={currentVals.map((v, i) => {
                              const p = getPoint(i, v);
                              return `${p.x},${p.y}`;
                            }).join(' ')}
                            fill="#8b949e"
                            fillOpacity={0.1}
                            stroke="#8b949e"
                            strokeWidth={1.5}
                          />
                          {/* New offer polygon */}
                          <polygon
                            points={offeredVals.map((v, i) => {
                              const p = getPoint(i, v);
                              return `${p.x},${p.y}`;
                            }).join(' ')}
                            fill="#34d399"
                            fillOpacity={0.15}
                            stroke="#34d399"
                            strokeWidth={1.5}
                          />
                          {/* Data points current */}
                          {currentVals.map((v, i) => {
                            const p = getPoint(i, v);
                            return <circle key={`curr-dot-${i}`} cx={p.x} cy={p.y} r={3} fill="#8b949e" />;
                          })}
                          {/* Data points offered */}
                          {offeredVals.map((v, i) => {
                            const p = getPoint(i, v);
                            return <circle key={`off-dot-${i}`} cx={p.x} cy={p.y} r={3} fill="#34d399" />;
                          })}
                          {/* Legend */}
                          <line x1={20} y1={190} x2={36} y2={190} stroke="#8b949e" strokeWidth={2} />
                          <text x={40} y={193} fill="#8b949e" fontSize={8}>Current</text>
                          <line x1={110} y1={190} x2={126} y2={190} stroke="#34d399" strokeWidth={2} />
                          <text x={130} y={193} fill="#34d399" fontSize={8}>New Offer</text>
                        </>
                      );
                    })()}
                  </svg>
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
                  className="w-12 h-12 rounded-xl border-2 border-[#30363d] border-t-emerald-400"
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

              {/* ===== SVG #8: Signing Bonus Calculator ===== */}
              {(outcome === 'accepted' || outcome === 'counter_accepted') && (
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Total Contract Value</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    {(() => {
                      const baseWagesTotal = finalOffer.weeklyWage * 52 * finalOffer.yearsRemaining;
                      const signingBonusTotal = finalOffer.signingBonus;
                      const potentialBonuses = (finalOffer.performanceBonuses.goalsBonus ?? 0) * 10 +
                        (finalOffer.performanceBonuses.assistBonus ?? 0) * 8 +
                        (finalOffer.performanceBonuses.cleanSheetBonus ?? 0) * 12;
                      const grandTotal = baseWagesTotal + signingBonusTotal + potentialBonuses;
                      const maxVal = grandTotal || 1;
                      const segs = [
                        { label: 'Base Wages', value: baseWagesTotal, color: '#34d399' },
                        { label: 'Signing Bonus', value: signingBonusTotal, color: '#60a5fa' },
                        { label: 'Potential Bonuses', value: potentialBonuses, color: '#fbbf24' },
                      ];
                      const barW = 240;
                      const segRects = segs.reduce<Array<{ key: string; x: number; width: number; color: string; label: string; value: number }>>(
                        (acc, seg, si) => {
                          const sw = Math.max(2, (seg.value / maxVal) * barW);
                          const sx = 10 + acc.reduce((w, item) => w + item.width, 0);
                          return [...acc, { key: `seg-${si}`, x: sx, width: sw, color: seg.color, label: seg.label, value: seg.value }];
                        },
                        []
                      );
                      return (
                        <>
                          <svg viewBox={`0 0 ${barW + 20} 70`} style={{ width: '100%' }}>
                            {/* Stacked horizontal bar */}
                            {segRects.map((sr) => (
                              <g key={sr.key}>
                                <rect x={sr.x} y={8} width={sr.width} height={20} rx={0} fill={sr.color} fillOpacity={0.85}>
                                  <title>{sr.label}: {formatCurrency(sr.value, 'K')}</title>
                                </rect>
                              </g>
                            ))}
                            {/* Total text */}
                            <text x={10} y={52} fill="#c9d1d9" fontSize={11} fontWeight="bold">
                              Total: {formatCurrency(grandTotal, 'M')}
                            </text>
                          </svg>
                          {/* Legend */}
                          <div className="flex flex-wrap gap-3 mt-2">
                            {segs.map((seg, si) => (
                              <div key={`legend-${si}`} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: seg.color }} />
                                <span className="text-[10px] text-[#8b949e]">{seg.label}</span>
                                <span className="text-[10px] text-[#c9d1d9]">{formatCurrency(seg.value, 'K')}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* ===== SVG #9: Negotiation Quality Ring ===== */}
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Negotiation Quality</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 flex flex-col items-center">
                  <svg viewBox="0 0 120 120" style={{ width: 90, height: 90 }}>
                    {(() => {
                      const cx = 60;
                      const cy = 60;
                      const r = 48;
                      const strokeW = 10;
                      const quality = negotiationQuality;
                      const circumference = 2 * Math.PI * r;
                      const filled = circumference * (quality / 100);
                      const qualityColor = quality >= 70 ? '#34d399' : quality >= 40 ? '#f59e0b' : '#ef4444';
                      return (
                        <>
                          {/* Background ring */}
                          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#21262d" strokeWidth={strokeW} />
                          {/* Progress ring */}
                          <circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={qualityColor}
                            strokeWidth={strokeW}
                            strokeDasharray={`${filled} ${circumference}`}
                            strokeDashoffset={circumference * 0.25}
                            strokeLinecap="round"
                          />
                          {/* Score text */}
                          <text x={cx} y={cy - 4} textAnchor="middle" fill={qualityColor} fontSize={20} fontWeight="bold">{quality}</text>
                          <text x={cx} y={cy + 12} textAnchor="middle" fill="#8b949e" fontSize={8}>/ 100</text>
                          {/* Label */}
                          <text x={cx} y={cy + r + 18} textAnchor="middle" fill="#8b949e" fontSize={8}>
                            {quality >= 70 ? 'Excellent' : quality >= 40 ? 'Fair' : 'Poor'}
                          </text>
                        </>
                      );
                    })()}
                  </svg>
                </CardContent>
              </Card>

              {/* ===== SVG #10: Contract Comparison Market ===== */}
              {peerWages.length > 0 && (
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Position Wage Comparison</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <svg viewBox="0 0 280 120" style={{ width: '100%' }}>
                      {(() => {
                        const barMaxW = 150;
                        const maxWage = Math.max(...peerWages.map(p => p.wage), 1);
                        return peerWages.map((peer, idx) => {
                          const bw = Math.max(4, (peer.wage / maxWage) * barMaxW);
                          const yp = 8 + idx * 22;
                          return (
                            <g key={`peer-${idx}`}>
                              <text x={0} y={yp + 12} fill={peer.isPlayer ? '#34d399' : '#8b949e'} fontSize={9} fontWeight={peer.isPlayer ? 'bold' : 'normal'}>
                                {peer.name}
                              </text>
                              <rect x={65} y={yp} width={barMaxW} height={15} rx={3} fill="#21262d" />
                              <rect x={65} y={yp} width={bw} height={15} rx={3}
                                fill={peer.isPlayer ? '#34d399' : '#60a5fa'}
                                fillOpacity={peer.isPlayer ? 0.9 : 0.6}
                              />
                              <text x={65 + barMaxW + 6} y={yp + 12} fill={peer.isPlayer ? '#34d399' : '#c9d1d9'} fontSize={9} fontWeight={peer.isPlayer ? 'bold' : 'normal'}>
                                {formatCurrency(peer.wage, 'K')}
                              </text>
                            </g>
                          );
                        });
                      })()}
                    </svg>
                  </CardContent>
                </Card>
              )}

              {/* ===== SVG #11: Future Earnings Projection ===== */}
              {(outcome === 'accepted' || outcome === 'counter_accepted') && (
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Future Earnings Projection</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    {(() => {
                      const years = finalOffer.yearsRemaining;
                      const weeklyWage = finalOffer.weeklyWage;
                      const yearlyData: Array<{ year: string; earnings: number }> = [];
                      for (let yi = 1; yi <= years; yi++) {
                        const yearEarnings = weeklyWage * 52 * yi;
                        yearlyData.push({ year: `Y${yi}`, earnings: yearEarnings });
                      }
                      const maxEarnings = Math.max(...yearlyData.map(d => d.earnings), 1);
                      const totalEarnings = yearlyData.length > 0 ? yearlyData[yearlyData.length - 1].earnings : 0;
                      const chartW = 240;
                      const chartH = 80;
                      const pad = 10;
                      const stepX = chartW / Math.max(yearlyData.length - 1, 1);
                      return (
                        <>
                          <svg viewBox={`0 0 ${chartW + pad * 2} ${chartH + pad * 2 + 20}`} style={{ width: '100%' }}>
                            {/* Grid lines */}
                            {[0, 1, 2, 3, 4].map(gi => (
                              <line
                                key={`earn-grid-${gi}`}
                                x1={pad}
                                y1={pad + (chartH / 4) * gi}
                                x2={pad + chartW}
                                y2={pad + (chartH / 4) * gi}
                                stroke="#21262d"
                                strokeWidth={1}
                              />
                            ))}
                            {/* Area fill */}
                            {yearlyData.length > 1 && (
                              <polygon
                                points={
                                  yearlyData.map((d, i) =>
                                    `${pad + i * stepX},${pad + chartH - (d.earnings / maxEarnings) * chartH}`
                                  ).join(' ') +
                                  ` ${pad + (yearlyData.length - 1) * stepX},${pad + chartH} ${pad},${pad + chartH}`
                                }
                                fill="#34d399"
                                fillOpacity={0.12}
                              />
                            )}
                            {/* Area line */}
                            {yearlyData.length > 1 && (
                              <polyline
                                fill="none"
                                stroke="#34d399"
                                strokeWidth={2}
                                points={yearlyData.map((d, i) =>
                                  `${pad + i * stepX},${pad + chartH - (d.earnings / maxEarnings) * chartH}`
                                ).join(' ')}
                              />
                            )}
                            {/* Data points and year labels */}
                            {yearlyData.map((d, i) => (
                              <g key={`earn-${i}`}>
                                <circle
                                  cx={pad + i * stepX}
                                  cy={pad + chartH - (d.earnings / maxEarnings) * chartH}
                                  r={4}
                                  fill="#34d399"
                                  stroke="#0d1117"
                                  strokeWidth={2}
                                />
                                <text
                                  x={pad + i * stepX}
                                  y={pad + chartH + 14}
                                  textAnchor="middle"
                                  fill="#8b949e"
                                  fontSize={8}
                                >
                                  {d.year}
                                </text>
                                <text
                                  x={pad + i * stepX}
                                  y={pad + chartH - (d.earnings / maxEarnings) * chartH - 8}
                                  textAnchor="middle"
                                  fill="#c9d1d9"
                                  fontSize={7}
                                >
                                  {formatCurrency(d.earnings, 'M')}
                                </text>
                              </g>
                            ))}
                            {/* Total label */}
                            <text x={pad + chartW} y={pad + chartH + 26} textAnchor="end" fill="#34d399" fontSize={9} fontWeight="bold">
                              Total: {formatCurrency(totalEarnings, 'M')}
                            </text>
                          </svg>
                        </>
                      );
                    })()}
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
