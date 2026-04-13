# Task: Career Retirement Planning Screen

## Files Modified

### 1. `/home/z/my-project/src/lib/game/types.ts`
- Added `'career_retirement'` to the `GameScreen` union type
- Added `retirementPending: boolean` and `retirementRiskPushed: boolean` to `GameState` interface

### 2. `/home/z/my-project/src/store/gameStore.ts`
- Added `calculateRetirementProbability()` exported function:
  - Base: 0% at age ≤32, 5% at 33, +8% per year (33=5%, 34=13%, 35=21%, 36=29%, 37=37%, 38+=45%)
  - Modifiers: Low fitness (<50): +10%, Many injuries (>10): +8%, Career-threatening: +15%, High morale (>80): -5%, Low morale (<30): +8%
- Added retirement check in `advanceWeek()` season rollover section (age 33+):
  - Deterministic roll using age + season + injury count
  - Sets `retirementPending` flag and navigates to `career_retirement` screen
  - Sends notification
- Added `retirementPending`/`retirementRiskPushed` to new career initialization
- Added migration for these fields in `migrateGameState()`
- Added both fields to the state commit in `advanceWeek()`

### 3. `/home/z/my-project/src/components/game/CareerRetirement.tsx` (NEW - ~530 lines)
Sections implemented:
- **Header**: "Career Outlook" with Hourglass icon, age badge, "Decision Needed" pulsing button when retirement pending
- **Retirement Risk Gauge (SVG)**: Semi-circular speedometer gauge with needle/indicator, color-coded (emerald/amber/red), age markers at 32/34/36/38
- **Physical Condition Assessment**: 2x2 grid - Fitness Level, Injury History, Decline Rate, Estimated Seasons Remaining
- **Career Legacy Preview**: Stats grid (goals, assists, apps, trophies, seasons), trophy badges, "Hall of Fame Eligible" badge, career highlights timeline (top 5 moments)
- **Age Decline Chart (SVG)**: Line chart projecting Physical/Technical/Mental decline from current age to 40, with current age vertical marker
- **Post-Retirement Options**: 4 cards (Stay as Player, Transition to Coaching, Punditry Career, Club Ambassador) with "Coming Soon" badges
- **Risk Factors Breakdown**: Detailed modifier breakdown showing how retirement probability is calculated
- **Retirement Decision Modal**: Narrative text, career summary stats, "Accept Retirement" and "Push Through" buttons with clear explanations of consequences

### 4. `/home/z/my-project/src/app/page.tsx`
- Added import for `CareerRetirement`
- Updated `screenComponents` map: `career_retirement: CareerRetirement` (was previously `Dashboard`)
- Added `'career_retirement'` to `gameScreens` array

### 5. `/home/z/my-project/src/components/game/BottomNav.tsx`
- Added `Hourglass` import from lucide-react
- Added nav entry in Career category: `{ screen: 'career_retirement', icon: <Hourglass />, label: 'Retirement' }`

## Verification
- TypeScript: 0 new errors in src/ (only pre-existing YouthAcademy.tsx errors from other work)
- ESLint: 0 errors, 4 warnings (all pre-existing, in MatchDayLive.tsx)
- Uncodixify compliant: No transforms, no rounded-full >24px, no gradients, no backdrop-blur, dark theme colors only, opacity-only animations
