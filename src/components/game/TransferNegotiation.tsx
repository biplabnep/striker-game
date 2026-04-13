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
