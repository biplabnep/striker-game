---
Task ID: 22
Agent: main
Task: Enhance MoralePanel.tsx and EventsPanel.tsx with 6 requirements each

## MoralePanel.tsx Changes

### 1. Team Spirit SVG Gauge (replaced old MoraleGauge)
- **3-segment semicircular gauge** (red 0-30, amber 30-60, emerald 60-100) instead of old 4-segment
- SVG arc from 180° to 360° (true semicircle speedometer style)
- **Small circle indicator** at the current morale value position on the arc (r=6, with stroke)
- **Percentage text** centered below the arc ("TEAM SPIRIT" label + "XX%" value)
- **"Low", "Medium", "High" labels** at key positions along the arc with matching colors

### 2. Morale Factors Visual Breakdown (new FactorBreakdownCard component)
- Each factor displayed as a card with:
  - **Center-origin horizontal bar**: positive impact extends RIGHT from center (emerald), negative extends LEFT (red)
  - Bar width proportional to impact magnitude (max reference: 25 points)
  - **Category icons** updated per spec: match=Target, personal=User (was Heart), team=Users, contract=FileText, social=MessageCircle (was Brain)
  - **Expiry badge** shows "Expires Wk X" format instead of "Xw left"
  - **Staggered opacity-in animation** with 0.06s delay between cards

### 3. Morale History Trend — SVG Sparkline (replaced old MoraleBarChart)
- **10 weeks** of data instead of 5 checkpoints (generateMoraleSparkline function)
- **ViewBox 200×50** (plus 16px for labels)
- **Polyline** with emerald stroke (#34d399), 2px width
- **Semi-transparent fill** underneath the polyline (emerald at 0.08 opacity)
- **Dot markers** at each week (r=2 for normal, r=3 for min/max, r=3.5 for current)
- **Min/Max labels** displayed above/below extreme points (amber for peak, red for low)
- Week labels on X-axis ("Now", "-3w", "-6w", "-9w")

### 4. Emoji Mood Indicator (new EmojiMoodIndicator component)
- Large **48px emoji** in a 16×16 rounded-xl container with tinted background:
  - 80-100: 😊 (bg-emerald-500/10, green tint)
  - 60-79: 🙂 (bg-amber-500/10, amber tint)
  - 40-59: 😐 (bg-[#21262d], neutral)
  - 20-39: 😟 (bg-orange-500/10, orange tint)
  - 0-19: 😤 (bg-red-500/10, red tint)
- Morale level text label displayed below the emoji (matching color)

### 5. Quick Actions Section (new QuickActionsSection component)
- 3-column grid of actionable cards:
  - **"Team Meeting"** (emerald border, Users icon, +5 Morale) — recommended when morale < 50
  - **"Individual Training"** (sky border, Dumbbell icon, +3 Morale, +2 Fitness) — recommended when 50-80
  - **"Rest Day"** (purple border, Bed icon, +4 Morale, -3 Fitness) — recommended when >= 80
- Each card has: icon, label, description, effect text, and "Recommended" badge
- Emerald ring highlight on recommended card

### 6. Uncodixify Fixes
- Changed conservative mindset color from `text-blue-400` to `text-sky-400` (no indigo/blue)
- All rounded-full replaced with rounded-lg/rounded-md/rounded-sm (checked all elements)
- No gradients, no backdrop-blur (verified)
- All animations use only opacity (no y/x/scale/rotate transforms)
- No height:0→auto transitions

---

## EventsPanel.tsx Changes

### 1. Category Filter Tabs (new horizontal pill-style tabs)
- 8 categories: All | Match | Transfer | Personal | Social | Club | Injury | Achievement
- Each tab shows **icon + label + count badge**
- **Active tab**: emerald background (bg-emerald-500/15), emerald border, emerald text
- **Inactive tab**: dark bg (bg-[#0d1117]), dark border (border-[#21262d]), gray text
- Horizontal scrollable with hidden scrollbar
- Only shows tabs with existing events (plus "All" always visible)
- Works for both Active and Resolved tabs

### 2. Timeline Visual Layout (new TimelineEventCard + ResolvedTimelineCard)
- **Left vertical line** in #21262d connecting all events
- **Circular nodes** (rounded-lg, 6×6) at each event, colored by category:
  - match=emerald (#34d399), transfer=amber (#fbbf24), personal=sky (#38bdf8),
  - social=purple (#c084fc), club=cyan (#22d3ee), injury=red (#f87171), achievement=amber (#fbbf24)
- Event cards positioned to the right of the timeline
- **Relative time labels** ("This week", "1w ago", "5w ago") above each card

### 3. Event Importance Indicators (enhanced importanceConfig)
- **High importance**: left border red (border-l-red-500), full padding (p-4), opacity 1.0
- **Medium importance**: left border amber (border-l-amber-500), normal padding (p-3), opacity 0.85
- **Low importance**: left border #30363d (border-l-[#30363d]), normal padding (p-3), opacity 0.65
- All applied via `border-l-[3px]` on the event card

### 4. Event Category Icons (getEventCategoryIcon function)
- Match events: **Trophy** icon
- Transfer events: **ArrowLeftRight** icon
- Personal events: **User** icon
- Social events: **MessageCircle** icon
- Club events: **Shield** icon
- Achievement events: **Award** icon
- Injury events: **Heart** icon
- Each icon appears in both the timeline node and the card header

### 5. Empty State (new FilterEmptyState component)
- When no events match the active category filter:
  - Filter icon in a 14×14 rounded-lg container
  - "No events in this category" heading
  - Contextual message: "No {category} events found. Try a different filter."
- Also kept the original "No pending events" empty state for when there are no events at all

### 6. Uncodixify Fixes
- Replaced shadcn Tabs component with custom buttons for Active/Resolved toggle (removed TabsList/TabsTrigger)
- Replaced Tabs-based category filter with custom pill buttons
- All animations use only opacity (whileHover uses opacity: 0.85)
- No rounded-full on elements > 24px (checked all nodes/badges — using rounded-lg/rounded-md/rounded-sm)
- No gradients, no backdrop-blur
- Dark theme colors throughout

---

## Verification
- TypeScript: 0 errors in src/ (grep for MoralePanel/EventsPanel — clean)
- Lint: 0 errors (4 pre-existing warnings in MatchDayLive.tsx — non-blocking)
- Dev server: running, 200 responses confirmed
