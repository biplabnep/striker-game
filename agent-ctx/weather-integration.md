# Task: Wire WeatherSystem into Match Simulation Engine

## Status: COMPLETED

## Files Modified

### 1. `/home/z/my-project/src/lib/game/types.ts`
- Added `WeatherType` union type (8 weather types)
- Added `WeatherStatModifier` interface
- Added `WeatherCondition` interface (type, name, severity, modifiers)
- Added `'weather'` to `MatchEventType` union
- Added `currentWeather: WeatherCondition | null` and `weatherPreparation: 'standard' | 'adapt' | 'ignore'` to `GameState`

### 2. `/home/z/my-project/src/lib/game/matchEngine.ts`
- Imported `WeatherCondition` type
- Added `WEATHER_ENGINE_MODIFIERS` constant mapping each weather type to stat modifier arrays
- Added `WEATHER_COMMENTARY` constant with weather-specific commentary templates
- Added `applyWeatherToPlayer()` function that applies weather modifiers to player attributes based on preparation choice:
  - `standard` = full effects
  - `adapt` = 50% mitigation
  - `ignore` = 30% worse
- Updated `simulateMatch()` to accept optional `weather` and `weatherPreparation` parameters
- Updated `simulateMatchMinute()` to accept optional `weather` parameter
- Weather modifies goal rate (severe weather = 15% reduction, mild = 8% reduction)
- Weather events (commentary) generated randomly during simulation (~1.5% per minute)

### 3. `/home/z/my-project/src/store/gameStore.ts`
- Imported `WeatherCondition` and `WeatherType`
- Added `setWeatherPreparation` action to store interface and implementation
- Added `generateWeatherCondition()` helper using deterministic formula: `(season * 13 + week * 7) % 8`
- Weather generation happens at start of `advanceWeek()` (before match sim)
- All `simulateMatch()` calls pass `currentWeather` and `weatherPreparation`
- New career starts include initial weather for Season 1 Week 1
- Migration function includes weather fields for backward compatibility

### 4. `/home/z/my-project/src/components/game/WeatherSystem.tsx`
- Added `Flame` import from lucide-react
- Added `MATCH_ENGINE_EFFECTS` constant (visual bars matching engine modifiers)
- Component now reads/writes `weatherPreparation` from/to game store via `setWeatherPreparation`
- Added "Match Impact" card with:
  - Visual colored bars showing each stat modifier (red=penalty, green=bonus)
  - Preparation-aware badge (ADAPTED -50% / PUSHING +30%)
  - Animated bars that fill based on modifier magnitude
  - Weather commentary about expected match impact

### 5. `/home/z/my-project/src/components/game/MatchDay.tsx`
- Added `currentWeather` from game state
- Added weather emoji indicator in simulation scoreboard header (shows during active weather)
- Added `'weather'` to significant events filter
- Added `weather` case to all event helper functions (icon, color, bg, dot, label)
- Weather events appear as amber-tinted notification cards in the event feed

### 6. `/home/z/my-project/src/components/game/MatchDayLive.tsx`
- Added `weather: '🌤️'` to the icon map in the event display

### 7. `/home/z/my-project/src/components/game/MatchHighlightsEnhanced.tsx`
- Added `weather` to icon map and label map for event display

## TypeScript Verification
- **0 errors in `src/` directory** (4 pre-existing errors in `examples/`, `skills/` directories unrelated to changes)
- All `Record<MatchEventType, ...>` types properly include the new `weather` case

## Weather Effects Summary
| Weather | Pace | Shooting | Passing | Physical | Fatigue | Goal Rate |
|---------|------|----------|---------|----------|---------|-----------|
| Sunny | - | - | - | - | - | Normal |
| Cloudy | - | - | - | - | - | Normal |
| Rainy | -10% | -15% | -10% | - | - | -8% |
| Windy | - | -10% | -15% | - | - | -8% |
| Snowy | -20% | -15% | - | -10% | - | -15% |
| Hot | -10% | - | - | -15% | +20% | -15% |
| Stormy | -15% | -20% | -15% | -10% | +20% | -15% |
| Foggy | - | -5% | -10% | - | - | Normal |

## Backward Compatibility
- All weather parameters are optional with defaults (`null`/`'standard'`)
- Migration function ensures old saves load without issues
- Simulation works identically when no weather data is present
