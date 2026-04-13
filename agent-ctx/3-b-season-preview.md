---
Task ID: 3-b
Agent: main
Task: Create Season Preview modal and integrate into Dashboard

Work Log:
- Created `/home/z/my-project/src/components/game/SeasonPreview.tsx` (~290 lines)
- Modified `/home/z/my-project/src/components/game/Dashboard.tsx` (4 edits: import, state/ref, useEffect, render)

Changes Made:

1. **SeasonPreview.tsx** (new file):
   - Full-screen overlay modal with `AnimatePresence` + `motion.div` (opacity-only animations — no y/x/scale transforms)
   - **Season Header**: Shows "Season X" with year range (e.g., "2024/25"), club logo + name, player name + flag + position
   - **League Overview**: 3-column grid showing league emoji+name, team count, total matchdays (38 for 20-team leagues, 34 for 18-team leagues). Key rivals section with 3-4 rival club badges from same league (selected deterministically by season number for consistency)
   - **Pre-Season Assessment**: 
     - Overall rating card with growth room indicator ("+X to POT Y")
     - Form trend card: mini bar chart of last 5 match ratings from previous season, with trend label (Improving/Declining/Stable)
     - Season objectives preview from `gameState.seasonObjectives` showing up to 4 objectives with status badges and board expectation label
   - **Fixture Highlights**: First 5 league fixtures (matchday 1-5) with home/away indicators. Home matches styled in emerald, away in slate. Each shows opponent shortName, matchday number, HOME/AWAY badge
   - **Ready to Begin button**: Emerald button at bottom dismissing modal, with week/matchday info
   - Dark theme: bg-[#0d1117], bg-[#161b22], border-[#30363d], text-[#c9d1d9], text-[#8b949e], emerald accents
   - Mobile responsive (max-w-lg mx-auto, pb-20 for bottom nav clearance)
   - Uses `getClubsByLeague`, `getLeagueById`, `getSeasonMatchdays`, `getClubById` from clubsData
   - Uses `NATIONALITIES` from playerData
   - Reads from `useGameStore`: player, currentClub, currentSeason, currentWeek, year, recentResults, upcomingFixtures, seasonObjectives
   - Staggered opacity animations for rivals, objectives, and fixture items

2. **Dashboard.tsx Integration**:
   - Added `import SeasonPreview from '@/components/game/SeasonPreview'`
   - Added `showSeasonPreview` state with `useState(false)`
   - Added `seasonPreviewRef` with `useRef(false)` to track if preview was shown this session
   - Added `useEffect` that auto-shows the modal when `currentWeek === 1` and ref is false (with 300ms delay to avoid flash)
   - Ref resets to false when week > 1, so it can show again on next season start
   - Rendered `<SeasonPreview open={showSeasonPreview} onClose={...} />` at bottom alongside other modals

Technical Implementation:
- No y/x/scale transforms on framer-motion (only opacity transitions)
- No gradients, no backdrop-blur, no glassmorphism — solid colors and border treatments only
- No rounded-full on elements >24px
- No height:0→auto transitions
- Lint passes clean (0 errors)
- Dev server compiles without errors
