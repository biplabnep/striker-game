---
Task ID: 37
Agent: main (cron Cycle 37)
Task: Full dev cycle — QA 93→95 screens, 5 TS/lint fixes, 2 styling (LoanSystem, FantasyDraft), 2 new features (MatchWeatherEffects, RefereeSystem), 4 parallel agents

## Current Project Status Assessment
- **Project:** Elite Striker — 100% client-side football career simulation SPA
- **Tech Stack:** Next.js 16, TypeScript 5, Zustand 5, Tailwind CSS 4, shadcn/ui, Framer Motion 12
- **Lint:** 0 errors, 0 warnings
- **TypeScript (src/):** Clean (0 errors)
- **Uncodixify Compliance:** 100%
- **Total Screens:** 95 registered GameScreen types (added match_weather_effects, referee_system)
- **New Components:** MatchWeatherEffects.tsx (NEW ~2,122 lines), RefereeSystem.tsx (NEW ~1,682 lines)
- **Enhanced Components:** LoanSystem.tsx (1,275→1,915 lines, +640), FantasyDraft.tsx (1,504→2,095 lines, +591)

Work Log:

### Phase 1: Assessment & QA
- TS: 0 src/ errors, Lint: 0 errors, 93 screens all PASS via agent-browser

### Phase 2: Bug Fixes
- **RefereeSystem.tsx line 1502**: JSX syntax error — mismatched `)` in SVG text attribute `x={...})`. Fixed to `x={...}`.
- **RefereeSystem.tsx line 78**: MatchIncident interface `team` type missing `'neutral'`. Added to union: `'home' | 'away' | 'neutral'`.
- **RefereeSystem.tsx line 1295**: Comparison `incident.team === 'neutral'` flagged as unintentional after type narrowing. Simplified to `incident.team === 'home'`.
- **RefereeSystem.tsx line 1363**: `ListChecks` icon not imported. Added to lucide-react import.
- **FantasyDraft.tsx line 1380-1381**: `n.pos` (string) not assignable to `Position`; `n` referenced in wrong scope. Fixed with `as Position` cast and corrected closure variable names.
- **MatchWeatherEffects.tsx line 589**: Local `Card` component doesn't accept `onClick` prop. Wrapped with a `<div onClick>` wrapper.

### Phase 3: Parallel Development — 4 Task Agents

#### Agent 1: LoanSystem.tsx — Styling (1,275 → 1,915 lines, +640)
- **Loan Market Scout Board**: 6 loan target cards in 2-col grid with filter bar (position/OVR/league/sort), each showing name, position, OVR, age, club, loan type, wage contribution %
- **Loan Comparison Matrix**: 3 shortlisted targets compared across 6 metrics with horizontal bars, "Recommended Pick" auto-calculated badge
- **Loan History Timeline**: Vertical timeline with 4 past loans (Brentford/Lille/Real Betis/Wolves), color-coded success dots, career trajectory indicator
- **Loan Performance Tracker**: Active loan card (Adrian Silva at Southampton), performance bars (matches/goals/rating vs expected), OVR development +2, recall/extend buttons
- **Loan Financial Impact**: Wage savings vs costs, fee breakdown, future projection, budget impact bar

#### Agent 2: FantasyDraft.tsx — Styling (1,504 → 2,095 lines, +591)
- **Draft Pick Value Chart**: SVG horizontal bar chart of 12 pick positions, colored by tier (Top 3 emerald, 4-6 blue, 7-9 amber, 10-12 red), "Best Available" and "Biggest Steal" indicators
- **Draft War Room**: 3 strategy cards (BPA/Fill Need/Trade Down) with risk level and success rate, position priority board (10 positions)
- **Opponent Draft Board**: 4 simulated teams (Barcelona/Bayern/PSG/Inter) with last 3 picks, draft grades A-F, predicted next picks
- **Draft Combine Results**: 8 drills with percentile bars for top 6 players, league average reference, overall combine score with letter grade
- **Post-Draft Analysis**: Draft grade A-F, steals/reaches cards, needs filled vs remaining, SVG radar chart (ATK/MID/DEF/DEP/YTH/POT)

#### Agent 3: MatchWeatherEffects.tsx — NEW Feature (~2,122 lines)
- **Weather Overview Dashboard**: Current conditions (temp/humidity/wind/pitch), 5-day forecast strip, severity badge, change probability
- **Weather Impact Analysis**: 6 expandable condition cards (Sunny/Rain/Snow/Wind/Fog/Extreme Heat) with attribute impacts, who benefits/suffers
- **Tactical Weather Adjustments**: Kit selection (sleeves/studs), hydration strategy, 3 tactical toggles, Auto-Optimize button
- **Player Weather Suitability**: 6 players with suitability meters, weather specialist badges (Rain Master/Cold Warrior/Heat Resistant), recommended XI
- **Historical Weather Performance**: W/D/L per condition, SVG bar chart, best/worst weather indicators
- **Weather Events During Match**: 3 simulated in-match events (35'/60'/75') with tactical recommendations and substitution suggestions
- **Stadium Weather Infrastructure**: Roof/heating/drainage facilities with mitigation %, pitch condition meter, upgrade button
- **Registered**: match_weather_effects, BottomNav Playing (CloudSun icon)

#### Agent 4: RefereeSystem.tsx — NEW Feature (~1,682 lines)
- **Match Official Overview**: Next match referee card (Felix Brych) with rating, 4 key stats, assistant referees, VAR official
- **Referee Profile Database**: 12 referee profiles with search/filter, country flags, experience, ratings, card tendency badges
- **Referee Tendency Analysis**: 6 tendency bars, card magnet position breakdown, last 5 match history, controversy rating
- **Discipline Tracker**: Yellow/red card records, suspension status, visual timeline (10 matches), league comparison
- **VAR Decision Center**: 6 recent VAR incidents with type badges, decision flow, overturned indicators, review duration stats
- **Fair Play Table**: 10-club ranking with YC/RC/fouls/FP points, award indicator
- **Match Incident Timeline**: Visual horizontal timeline with colored shape markers (goals/cards/subs/VAR), incident log
- **Referee Stats Deep Dive**: Most card-happy/lenient referee, SVG performance trend chart, Referee of the Season nomination, league stats table
- **Registered**: referee_system, BottomNav Competitions (ShieldAlert icon)

### Phase 4: Post-Development QA
- 95 screens — all PASS, 0 runtime errors, 0 console errors
- TS: 0 errors in src/, Lint: 0 errors

Stage Summary:
- **2 new features** (MatchWeatherEffects — 6 conditions with impacts/tactical adjustments/player suitability/weather events/stadium infrastructure; RefereeSystem — 12-referee database/tendency analysis/discipline tracker/VAR center/fair play table/incident timeline)
- **2 styling enhancements** (LoanSystem — scout board with filters, comparison matrix, history timeline, performance tracker, financial impact; FantasyDraft — pick value chart, war room with strategies, opponent draft board, combine results, post-draft radar analysis)
- **95 total unique GameScreen types** — all QA PASS
- **100% Uncodixify compliant, TS clean, Lint clean**

## Unresolved Issues or Risks
- 95 screens — very large app, UX organization remains critical
- Most systems visual-only (weather not affecting match engine, referee not connected to actual match simulation)
- Stadium upgrades duplicated across 3 components
- Social.tsx still exists alongside SocialMediaFeed.tsx
- Large files: PreSeasonTrainingCamp (3,413), CupBracket (3,002), ContinentalPanel (2,987), TacticalBriefing (2,971), FanEngagement (2,385), MatchWeatherEffects (2,122), FantasyDraft (2,095)

## Priority Recommendations
1. **New features** — Fan Chants/March System, Post-Match Press Conference Depth, Transfer Deadline Day Event, Player Agent Contract Negotiations
2. **Styling** — DailyRewards, WeatherSystem (original), SkillChallenges, CareerJournal
3. **Cleanup** — Remove old Social.tsx, consolidate stadium systems
4. **Performance** — Code split files >2,500 lines
5. **Integration** — Connect weather to match engine, referee decisions to match simulation
