# Task 8-b: ContractNegotiation.tsx Component

## Task ID: 8-b
## Agent: main

## Work Log

- Created `/home/z/my-project/src/components/game/ContractNegotiation.tsx` (~500 lines)
- Modified `/home/z/my-project/src/store/gameStore.ts` — added negotiateContract action
- Modified `/home/z/my-project/src/components/game/TransferHub.tsx` — added "Negotiate Contract" button
- Modified `/home/z/my-project/src/components/game/Dashboard.tsx` — added "Contract expiring!" alert

## Changes Made

### 1. ContractNegotiation.tsx — New Dialog component with 5 negotiation phases

- **Overview Phase**: Contract Status Overview card with current wage, years remaining (color-coded), market value, release clause, signing bonus. Warning alerts for ≤1/≤2 years. "Start Negotiation" button.
- **Offer Phase**: Club offer displayed as Contract Offer Card with proposed wage (with comparison), contract length, signing bonus, performance bonuses (goals/assists/clean sheet), release clause. Round indicator (3 max). Accept/Counter-Offer/Reject buttons.
- **Counter-Offer Phase**: Wage demand slider (0.5x-2.5x club offer), contract length dropdown (1-5 years), comparison panel. Submit/Back buttons.
- **Response Phase**: Animated spinner while club considers counter-offer.
- **Outcome Phase**: Four outcomes — Accepted (PartyPopper animation + contract summary), Counter Accepted, Rejected by Player, Walked Away (negotiation summary showing all rounds).

### 2. Offer Generation Logic

- `generateClubOffer()`: Initial offer based on player form, reputation, club finances, squad status. Uses calculateWage() as base with multipliers. Contract length varies by age. Signing bonus 2-8 weeks wages. Performance bonuses by position. Release clause 50% chance.
- `generateClubResponse()`: Club responds to counter-offers. Rejects if >50% above offer by round 3. Accepts within 10%. Compromises at meet-point based on importance × finances. Max 3 rounds.

### 3. Store Integration (negotiateContract action)

- Updates player.contract.weeklyWage, yearsRemaining, signingBonus, performanceBonuses, releaseClause
- Updates player.marketValue based on new contract
- Adds +5 morale boost from successful negotiation
- Adds contract type notification with details

### 4. TransferHub.tsx Integration

- "Negotiate Contract" button below current contract card when yearsRemaining ≤ 2
- Red button for ≤1 year, amber for ≤2 years

### 5. Dashboard.tsx Integration

- "Contract Expiring!" alert in Season Info section when yearsRemaining ≤ 2
- Small "Negotiate" button opens contract negotiation dialog
- FileText icon import added

## Technical Notes

- All shadcn/ui: Dialog, DialogContent, Card, CardContent, Button, Badge, Slider, Select, SelectTrigger, SelectContent, SelectItem
- All lucide-react: FileText, DollarSign, Clock, CheckCircle, XCircle, TrendingUp, TrendingDown, ArrowRight, AlertTriangle, PartyPopper, Handshake, RotateCcw, Ban, ChevronRight, Info
- framer-motion for animations (slide-in, scale spring, rotate spinner, AnimatePresence)
- Dark theme (slate-950/900 backgrounds, emerald/amber accents)
- Mobile responsive (max-w-md)
- Lint passes clean, dev server compiles without errors
