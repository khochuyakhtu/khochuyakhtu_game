# KhochuYakhtu Game Logic (Client)

## Time Flow
- Engine ticks at `FRAMES_PER_SECOND = 60`. In expedition, `gameTime` increments every frame. On island, a real second adds `FRAMES_PER_SECOND` (1 in‑game minute) via `App.jsx`.
- UI “Запустити цикл” on island adds `FRAMES_PER_WEEK` to `gameTime`, treating one cycle as a week.
- Real playtime is tracked in `gameState.playTimeSeconds` (real seconds): incremented every real second on island and every 60 frames in expedition. Leaderboard “time” uses this value.

## Resources & Storage
- Resource list comes from backend config. Initial limits: wood/stone 100, metal/plastic/food/water 50, energy unlimited, coal 20. Storage buildings add bonuses; limits are recalculated per building effects.
- Building limits: default per tier `{1:6, 2:5, 3:4, 4:3, 5:2}` with overrides (e.g., wonder/palace 1, factory 3, power_plant 2). Enforced in `addBuilding` and shown in shop.

## Production Cycle (Island)
- For each building with `output`:
  - Workers: efficiency = `assigned/slots` (capped at 1; auto if slots=0).
  - Level bonus: `1 + 0.15*(level-1)`.
  - Weather bonus for water only: `1 + waterBonus%/100`.
  - Production = `floor(baseOutput * efficiency * levelBonus * weatherBonus)`.
  - If `consumption` exists, required resources are checked at `consumption * efficiency`; if insufficient, no production. On success, consumption is deducted and output added respecting storage limit.
- Building effects (mood/health/storage) are applied each cycle.

## Residents: Upkeep & Death
- Each cycle every resident needs `2 food` and `2 water`. Resources are allocated resident‑by‑resident until exhausted; those who cannot be fed **die**.
- Surviving residents reset hunger to 100; health changes from building effects and mood as before. Mood gets an extra `-20` if deaths occurred in the cycle.
- Death handling: names logged to island event log (max 10), warning notification, and population averages recalculated from survivors only.

## Events
- 20% daily chance (per cycle button) to roll a random event with requirements (e.g., farm for harvest boon). Effects apply directly to resources/mood/health.

## Missions & Difficulty
- Missions are normalized client‑side: `difficulty = clamp(1..10, round(baseBiomeDanger + 0.8*(missionNumber-1)))`, using biome order/danger. Shown in Missions modal with progress gating by biome completion.

## Expedition Loop (Core Game)
- Entities spawn based on biome danger: mines, sharks, whirlpools, pirates, kraken tentacles, floating resources, survivors, oil slicks, icebergs.
- Magnet pickup radius reduced: base 20 (yacht) / 10 (player) * `player.pickupRange`. **Coffee is not affected by magnet**; only collected on close contact (radius 20). Coins/repair kits/floating resources respond to magnet.
- Player stats (speed, armor, pickup range, radar, etc.) derive from yacht modules and crew; gunner fires on interval from `getGunnerStats`.

## Buildings (Notable Tweaks)
- Factory consumes energy locally set to 10 per cycle (client‑side) if backend lacks consumption.
- Tier/era displayed as “Епоха I‑V”; shop uses wrapped chips (no horizontal scroll) and shows limits.

## Leaderboard
- Types: distance, money, time. “Time” uses `play_time_seconds` (fallback `play_time`) formatted as hours/minutes.

## UI Short Notes
- Bottom navigation: Огляд, Будівлі, Люди, Склад, Missions (⛵). Scroll enabled on pages with custom scrollbar styling.
- Notifications: ephemeral toasts via `useNotificationStore`; death events trigger warnings.

## Key Formulas Summary
- Time (island): `gameTime += 60` per real second; cycle button `+= FRAMES_PER_WEEK`.
- Production: `floor(baseOutput * efficiency * levelBonus * weatherBonus)` with `levelBonus = 1 + 0.15*(level-1)`.
- Magnet radius: `baseMagnet (20/10) * pickupRange`; coffee pickup radius 20 only.
- Resident upkeep per cycle: `foodNeed = 2`, `waterNeed = 2` per resident; insufficient stock kills the resident.
- Mission difficulty: `clamp(1..10, round(biomeDanger + 0.8*(missionNumber-1)))`.
