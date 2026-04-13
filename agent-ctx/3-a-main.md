# Task 3-a: Redesign BottomNav More Panel

**Agent**: main  
**File Modified**: `/home/z/my-project/src/components/game/BottomNav.tsx`

## Summary of Changes

### Removed
- `expandedCategory` state and `handleCategoryToggle` function (accordion behavior)
- `getCategoryBadgeCount` function (no longer needed without accordion)
- `ChevronRight` import (no longer needed)
- `AnimatePresence` inside each category for accordion expand/collapse
- Active indicator dot (`absolute bottom-0.5 left-1/2 w-4 h-0.5`) on grid items

### Added
- **Search bar** at top of More panel with real-time filtering by item label
- **Recent screens section** (3-column grid, tracks last 3 accessed More items via `useState`)
- **`Clock` icon import** for Recent section header
- **`Search` icon import** (already existed) used in search input
- **`filteredCategories`** computed property that filters items based on search query
- **"No results" empty state** when search yields no matches
- **`itemByScreen` lookup map** (module-level `Map`) for O(1) item lookups from recent screen list
- **Inline clear button** (X) in search input when text is present

### Changed
- Category headers are now **non-interactive section dividers** with a trailing horizontal line (`<div className="flex-1 h-px bg-[#30363d]/50" />`)
- All items in **all categories are visible at once** in a flat 4-column grid (no expand/collapse)
- Recent section shows in a distinct **3-column grid** with `bg-[#0d1117]` background, only when not searching
- Panel max-height changed from `70vh` to `60vh` for the scrollable content area
- Active item highlight changed to `bg-emerald-500/15` (slightly stronger opacity)
- All animations are **opacity-only** (no y/x/scale transforms) — compliant with Uncodixify rules
- No gradients, no backdrop-blur — compliant with Uncodixify rules
- No `rounded-full` on elements > 24px — compliant with Uncodixify rules
- Notification badge on Events item preserved (red dot `w-2 h-2 rounded-full`, well under 24px)
- Main bottom nav bar (Home, Match, Table, Stats, More) preserved exactly as-is

### Preserved
- All `NavItem` and `NavCategory` interfaces unchanged
- All `mainNavItems` and `moreCategories` data unchanged
- Main bottom navigation bar unchanged (including badge counts, layoutId animations)
- PWA install banner compatibility (panel anchored at `bottom-16`)

### Lint
- `bun run lint` passes clean (0 errors, 0 warnings)
- Dev server compiles without errors
