// ============================================================
// Elite Striker - Transfer Market Engine
// Simulates the transfer market including offers, negotiations,
// loans, and club interest logic
// ============================================================

import {
  Player,
  Club,
  Position,
  TransferOffer,
  LoanOffer,
  Contract,
  SquadStatus,
} from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Transfer Windows ---
export function isTransferWindow(week: number): 'summer' | 'winter' | null {
  // Summer window: weeks 1-12
  if (week >= 1 && week <= 12) return 'summer';
  // Winter window: weeks 25-28
  if (week >= 25 && week <= 28) return 'winter';
  return null;
}

// --- Should Club Be Interested ---
export function shouldClubBeInterested(club: Club, player: Player): boolean {
  // Don't sign players at positions they don't need unless exceptional
  const needsPosition = club.needsPositions.includes(player.position) ||
                        player.secondaryPositions.some(p => club.needsPositions.includes(p));

  // Reputation check - clubs want players close to their level
  const repDiff = Math.abs(club.reputation - player.reputation);

  // Club will sign players up to 15 reputation points above them
  // And will consider players down to 20 below (especially for squad depth)
  if (player.reputation > club.reputation + 15) return false;

  // Quality check - player should improve the squad
  const qualityImprovement = player.overall - club.quality;

  // If player is worse than squad average, only interested if young (potential)
  if (qualityImprovement < -5 && player.age > 23) return false;
  if (qualityImprovement < -10 && player.age > 21) return false;

  // Need-based bonus - clubs with needs at the position are more interested
  if (!needsPosition && qualityImprovement < 5) return false;

  // Budget check
  const estimatedFee = estimateTransferFee(player, club);
  if (estimatedFee > club.budget) return false;

  // Wage check
  const estimatedWage = estimatePlayerWage(player, club);
  if (estimatedWage > club.wageBudget * 0.15) return false;

  return true;
}

// --- Estimate Transfer Fee ---
function estimateTransferFee(player: Player, buyingClub: Club): number {
  const baseValue = player.marketValue;

  // Age multiplier
  let ageMultiplier = 1.0;
  if (player.age <= 21) ageMultiplier = 1.4; // premium for young talent
  else if (player.age <= 24) ageMultiplier = 1.2;
  else if (player.age <= 27) ageMultiplier = 1.0;
  else if (player.age <= 30) ageMultiplier = 0.8;
  else ageMultiplier = 0.5;

  // Potential premium
  const potentialRoom = player.potential - player.overall;
  const potentialMultiplier = 1 + (potentialRoom / 100);

  // Contract length premium (harder to buy with longer contracts)
  const contractMultiplier = 1 + player.contract.yearsRemaining * 0.05;

  // Reputation premium
  const reputationMultiplier = 1 + (player.reputation / 200);

  // Club quality differential - bigger clubs pay more
  const clubPremium = buyingClub.reputation >= 80 ? 1.3 :
                      buyingClub.reputation >= 60 ? 1.1 : 1.0;

  return Math.round(
    baseValue * ageMultiplier * potentialMultiplier * contractMultiplier * reputationMultiplier * clubPremium
  );
}

// --- Estimate Player Wage ---
function estimatePlayerWage(player: Player, club: Club): number {
  // Base wage relative to market value (roughly 1% of value annually, divided by 52)
  const baseWageFromValue = player.marketValue * 0.01 / 52;

  // Quality-based wage
  const qualityWage = player.overall * player.overall * 5; // exponential scaling

  // Higher reputation clubs pay more
  const clubWageLevel = club.reputation >= 80 ? 2.0 :
                        club.reputation >= 60 ? 1.5 :
                        club.reputation >= 40 ? 1.2 : 1.0;

  const estimated = Math.max(baseWageFromValue, qualityWage) * clubWageLevel;

  // Minimum wages
  const minWage = club.reputation >= 70 ? 20000 : club.reputation >= 50 ? 5000 : 1000;

  return Math.round(Math.max(estimated, minWage));
}

// --- Calculate Transfer Fee ---
export function calculateTransferFee(
  player: Player,
  buyingClub: Club,
  sellingClub: Club
): number {
  const baseFee = estimateTransferFee(player, buyingClub);

  // Selling club premium - reluctant to sell to rivals
  let rivalryPremium = 1.0;
  if (sellingClub.league === buyingClub.league && sellingClub.reputation >= 60) {
    rivalryPremium = 1.3; // domestic rivals pay more
  }

  // Player wants to leave discount
  let motivationDiscount = 1.0;
  if (player.morale < 40) {
    motivationDiscount = 0.85; // unhappy player = cheaper
  } else if (player.squadStatus === 'transfer_listed') {
    motivationDiscount = 0.75; // club wants to sell
  }

  // Contract year discount
  let contractDiscount = 1.0;
  if (player.contract.yearsRemaining === 1) {
    contractDiscount = 0.6; // player can leave for free soon
  } else if (player.contract.yearsRemaining === 2) {
    contractDiscount = 0.85;
  }

  // Release clause override
  if (player.contract.releaseClause && baseFee * rivalryPremium * motivationDiscount * contractDiscount > player.contract.releaseClause) {
    return player.contract.releaseClause;
  }

  // Add random negotiation variance (±10%)
  const negotiationVariance = 0.9 + Math.random() * 0.2;

  return Math.round(baseFee * rivalryPremium * motivationDiscount * contractDiscount * negotiationVariance);
}

// --- Evaluate Transfer Suitability ---
export function evaluateTransferSuitability(player: Player, targetClub: Club): number {
  let score = 50; // base score

  // Positional need bonus (0-20 points)
  if (targetClub.needsPositions.includes(player.position)) {
    score += 20;
  } else if (player.secondaryPositions.some(p => targetClub.needsPositions.includes(p))) {
    score += 10;
  }

  // Quality fit bonus (0-15 points)
  const qualityDiff = player.overall - targetClub.quality;
  if (qualityDiff >= 10) score += 5; // star player
  else if (qualityDiff >= 5) score += 10; // key player
  else if (qualityDiff >= 0) score += 15; // good fit
  else if (qualityDiff >= -5) score += 10; // squad player
  else score += 3; // depth

  // Playing style compatibility (0-10 points)
  const style = targetClub.style;
  if (player.position === 'ST' || player.position === 'LW' || player.position === 'RW') {
    if (style.attacking >= 70) score += 10;
    else if (style.attacking >= 50) score += 5;
  } else if (player.position === 'CB' || player.position === 'CDM') {
    if (style.defensive >= 70) score += 10;
    else if (style.pressing >= 70) score += 7;
  } else if (player.position === 'CM' || player.position === 'CAM') {
    if (style.possession >= 70) score += 10;
    else if (style.attacking >= 60) score += 5;
  }

  // Age suitability (0-5 points)
  if (player.age <= 23) score += 5; // young = investment
  else if (player.age <= 29) score += 4; // peak = immediate impact
  else if (player.age <= 32) score += 2; // veteran = short-term
  else score += 0;

  // Reputation alignment (deduct for mismatch)
  const repDiff = Math.abs(player.reputation - targetClub.reputation);
  if (repDiff > 30) score -= 10;
  else if (repDiff > 20) score -= 5;

  // Squad size consideration
  if (targetClub.squadSize > 28) score -= 5; // already bloated squad

  return clamp(Math.round(score), 0, 100);
}

// --- Generate Transfer Offers ---
export function generateTransferOffers(
  player: Player,
  currentClub: Club,
  availableClubs: Club[],
  season: number
): TransferOffer[] {
  const offers: TransferOffer[] = [];
  const window = isTransferWindow(0); // caller should check

  // Number of interested clubs depends on player quality and agent
  const maxOffers = Math.min(
    Math.floor(player.reputation / 20) + Math.floor(player.agentQuality / 30),
    5
  );

  // Filter interested clubs
  const interestedClubs = availableClubs.filter(
    (club) => club.id !== currentClub.id && shouldClubBeInterested(club, player)
  );

  // Sort by suitability
  const rankedClubs = interestedClubs
    .map((club) => ({
      club,
      suitability: evaluateTransferSuitability(player, club),
    }))
    .sort((a, b) => b.suitability - a.suitability)
    .slice(0, maxOffers);

  for (const { club, suitability } of rankedClubs) {
    // Higher suitability = more likely to make an offer
    if (Math.random() > suitability / 100) continue;

    const fee = calculateTransferFee(player, club, currentClub);
    const wage = estimatePlayerWage(player, club);
    const yearsOffered = player.age <= 25 ? randInt(4, 5) :
                         player.age <= 29 ? randInt(3, 4) :
                         player.age <= 32 ? randInt(2, 3) : randInt(1, 2);

    const contractOffer: Contract = {
      weeklyWage: Math.round(wage * (0.9 + Math.random() * 0.3)),
      yearsRemaining: yearsOffered,
      signingBonus: Math.round(fee * (0.05 + Math.random() * 0.1)),
      performanceBonuses: {
        goalsBonus: ['ST', 'LW', 'RW', 'CAM'].includes(player.position)
          ? Math.round(wage * 2) : undefined,
        assistBonus: ['CAM', 'CM', 'LW', 'RW'].includes(player.position)
          ? Math.round(wage * 1.5) : undefined,
        cleanSheetBonus: ['GK', 'CB', 'LB', 'RB', 'CDM'].includes(player.position)
          ? Math.round(wage * 1.5) : undefined,
      },
    };

    // Release clause - more common in certain leagues
    if (Math.random() < 0.4) {
      contractOffer.releaseClause = Math.round(fee * (1.5 + Math.random() * 1.0));
    }

    // Determine squad role
    const qualityDiff = player.overall - club.quality;
    const squadRole: SquadStatus = qualityDiff >= 8 ? 'starter' :
                                   qualityDiff >= 3 ? 'rotation' :
                                   qualityDiff >= -3 ? 'rotation' : 'bench';

    offers.push({
      id: `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromClub: club,
      fee,
      contractOffer,
      squadRole,
      transferWindow: window === 'winter' ? 'winter' : 'summer',
      season,
      week: 0, // set by caller
    });
  }

  return offers;
}

// --- Generate Loan Offers ---
export function generateLoanOffers(
  player: Player,
  currentClub: Club,
  availableClubs: Club[]
): LoanOffer[] {
  const offers: LoanOffer[] = [];

  // Loans more likely for younger players not getting minutes
  const loanEligibility = (player.age <= 21 && player.squadStatus !== 'starter') ||
                          player.squadStatus === 'prospect' ||
                          player.squadStatus === 'bench';

  if (!loanEligibility && player.age > 24) return offers;

  // Filter clubs - loans usually to lower reputation clubs
  const loanClubs = availableClubs.filter(
    (club) => club.id !== currentClub.id &&
              club.reputation <= currentClub.reputation + 5 &&
              shouldClubBeInterested(club, player)
  );

  const maxLoanOffers = Math.min(loanClubs.length, 3);

  const selectedClubs = loanClubs
    .sort(() => Math.random() - 0.5)
    .slice(0, maxLoanOffers);

  for (const club of selectedClubs) {
    // Loan duration: rest of season or half season
    const durationWeeks = Math.random() < 0.6 ? randInt(16, 20) : randInt(8, 12);

    // Wage contribution
    const wageContribution = club.reputation >= currentClub.reputation - 10
      ? randInt(70, 100)
      : randInt(40, 70);

    offers.push({
      id: `loan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromClub: club,
      durationWeeks,
      guaranteedMinutes: Math.random() < 0.5,
      wageContribution,
      season: 0, // set by caller
      week: 0, // set by caller
    });
  }

  return offers;
}

// --- Execute Transfer ---
export function executeTransfer(
  player: Player,
  fromClub: Club,
  toClub: Club,
  fee: number
): { updatedPlayer: Partial<Player>; newContract: Contract } {
  // Generate new contract
  const wage = estimatePlayerWage(player, toClub);
  const yearsOffered = player.age <= 25 ? randInt(4, 5) :
                       player.age <= 29 ? randInt(3, 4) :
                       player.age <= 32 ? randInt(2, 3) : 1;

  const newContract: Contract = {
    weeklyWage: Math.round(wage * (0.95 + Math.random() * 0.2)),
    yearsRemaining: yearsOffered,
    signingBonus: Math.round(fee * 0.05),
    performanceBonuses: {
      goalsBonus: ['ST', 'LW', 'RW', 'CAM'].includes(player.position)
        ? Math.round(wage * 2) : undefined,
      assistBonus: ['CAM', 'CM', 'LW', 'RW'].includes(player.position)
        ? Math.round(wage * 1.5) : undefined,
      cleanSheetBonus: ['GK', 'CB', 'LB', 'RB', 'CDM'].includes(player.position)
        ? Math.round(wage * 1.5) : undefined,
    },
  };

  // Determine new squad status
  const qualityDiff = player.overall - toClub.quality;
  const newSquadStatus: SquadStatus = qualityDiff >= 10 ? 'starter' :
                                       qualityDiff >= 5 ? 'starter' :
                                       qualityDiff >= 0 ? 'rotation' : 'bench';

  // Player updates after transfer
  const updatedPlayer: Partial<Player> = {
    // Morale boost from transfer (usually)
    morale: clamp(player.morale + randInt(5, 15), 0, 100),
    // New squad status
    squadStatus: newSquadStatus,
    // Market value may change based on new club reputation
    marketValue: Math.round(
      player.marketValue * (toClub.reputation > fromClub.reputation ? 1.1 : 0.95)
    ),
    // Reputation boost for big move
    reputation: toClub.reputation > fromClub.reputation + 10
      ? clamp(player.reputation + 3, 0, 100)
      : player.reputation,
    // Form resets somewhat with new team
    form: clamp(player.form * 0.8 + 6 * 0.2, 1, 10),
    // Contract
    contract: newContract,
  };

  return { updatedPlayer, newContract };
}

// --- Execute Loan ---
export function executeLoan(
  player: Player,
  fromClub: Club,
  toClub: Club
): { updatedPlayer: Partial<Player> } {
  const updatedPlayer: Partial<Player> = {
    squadStatus: 'loan' as SquadStatus,
    morale: clamp(player.morale + randInt(-5, 10), 0, 100),
    // Form may reset - new environment, new teammates
    form: clamp(6.0, 1, 10),
  };

  return { updatedPlayer };
}
