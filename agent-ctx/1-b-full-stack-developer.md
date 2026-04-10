# Task 1-b: Build Simulation Engines
Agent: full-stack-developer

## Work Log

### Types File (`src/lib/game/types.ts`)
Created comprehensive type definitions including:
- Position types (GK through ST with position groups)
- PlayerAttributes (pace, shooting, passing, dribbling, defending, physical)
- Player interface with full career data (attributes, fitness, morale, form, reputation, marketValue, contract, injury history, stats, traits)
- Club interface with quality, reputation, budget, playing style, needs
- MatchResult, MatchEvent, MatchState for match simulation
- TrainingSession and TrainingType for progression
- GameEvent, EventChoice, EventEffects for random events
- TransferOffer, LoanOffer for transfer market
- SocialPost, Storyline for social/narrative engine
- WeekSimulation composite type for full week simulation

### Match Engine (`src/lib/game/matchEngine.ts`)
- Seeded RNG for reproducibility
- Position-based attribute weights for contribution calculation
- `determineSquadSelection()` - fitness, form, quality relative to club, squad status all factor into starting/minutes
- `simulateMatchMinute()` - minute-by-minute simulation with goals, chances, cards, injuries, substitutions, penalties
- `calculatePlayerMatchRating()` - 0-10 scale based on contribution, events, clean sheets, team result
- `simulateMatch()` - full 90-minute match with substitution logic, injury handling
- Home advantage, momentum system, playing style influence on tempo
- Realistic scoreline generation (Poisson-based probability distribution helper)

### Progression Engine (`src/lib/game/progressionEngine.ts`)
- Age-based growth multipliers (physical/technical/mental categories)
- `applyWeeklyProgression()` - training boosts by type, natural growth, fitness regeneration, morale drift, injury recovery
- `applySeasonProgression()` - match experience bonus, position-specific growth, age decline, market value updates
- `calculateAgeDecline()` - accelerating decline from age 30+
- `calculatePotentialGrowth()` - young player potential increases, late bloomer trait support
- `determineSquadStatusUpdate()` - quality relative to club determines role
- `updateForm()` - weighted rolling average of last 5 match ratings
- `applyInjuryRecovery()` - fitness/morale/form impact from injuries
- `calculateBirthdayEffects()` - age milestones affect market value, potential, squad status
- `calculateOverall()` - position-weighted attribute calculation

### Random Events Engine (`src/lib/game/randomEvents.ts`)
- 30+ unique event templates across 6 categories:
  - TRANSFER_RUMOR (7): Big club interest, overseas, rival approach, loan, release clause, Middle East, MLS
  - MEDIA_INTERVIEW (6): Press conference, documentary, controversial quote, podcast, social media storm, award nomination
  - PERSONAL_LIFE (6): Family emergency, relationship spotlight, investment, homesickness, charity foundation, language barrier
  - TEAM_CONFLICT (4): Tactical disagreement, coach criticism, training altercation, dressing room divide
  - MENTORSHIP (4): Veteran mentorship, academy mentoring, retiring legend advice, leadership role
  - SPONSORSHIP (4): Endorsement deal, charity campaign, controversial sponsor, local business
- Each event has 2-3 choices with different effects (morale, reputation, fitness, marketValue, attributes, form, squadStatus)
- Conditions-based eligibility (reputation thresholds, age, squad status, etc.)
- Weighted random selection for event generation
- Rich narrative text for each choice resolution
- `generateRandomEvent()`, `getEventPool()`, `resolveEventChoice()` as key exports

### Transfer Engine (`src/lib/game/transferEngine.ts`)
- Transfer window logic (summer: weeks 1-12, winter: weeks 25-28)
- `shouldClubBeInterested()` - reputation, quality, positional need, budget checks
- `calculateTransferFee()` - age, potential, contract length, rivalry, morale, release clause factors
- `evaluateTransferSuitability()` - 0-100 scoring for position need, quality fit, style compatibility, age
- `generateTransferOffers()` - agent quality affects number of offers, suitability-based selection
- `generateLoanOffers()` - young/bench players, lower reputation clubs, wage contribution levels
- `executeTransfer()` - new contract generation, squad status, market value/reputation adjustments
- `executeLoan()` - squad status change, morale and form adjustments

### Social Engine (`src/lib/game/socialEngine.ts`)
- Post templates for fans, media, pundits, officials, agents (positive/negative/neutral variants)
- `processMediaReaction()` - post-match social media based on player rating and team result
- `generateSocialPost()` - contextual posts for goals, assists, transfers, injuries, contracts
- 10 storyline templates: Golden Boot Chase, Contract Standoff, Rise of Wonderkid, Injury Return, Captain Controversy, Local Hero, Derby Day, Out of Form, Title Race, International Recognition
- `generateNewStoryline()` - conditions-based, weighted random selection
- `updateStorylines()` - phase progression, sentiment tracking, resolution logic
- `calculatePublicSentiment()` - weighted average of recent posts + active storylines with engagement and source credibility weights

## Stage Summary
- All 5 core simulation engines created with comprehensive game logic
- TypeScript compilation passes with no errors in these files
- Ready for Zustand store integration and UI implementation
