---
name: maintain-tianyang-burger-factory
description: Maintain and extend the TypeScript, Phaser 3, Vite/Vinext mobile web game 《天陽的漢堡工廠》 while preserving its V1 gameplay contract. Use when Codex must inspect, modify, debug, test, document, tune, build, or release this project, including split-touch input, food state logic, full-line returns, responsive layout, high-resolution rendering, tutorial, audio, PWA, storage, performance, or mobile-browser behavior.
---

# Maintain Tianyang Burger Factory

Maintain the production game without weakening its two-choice reaction loop, mobile responsiveness, deterministic movement, or restart safety.

## Establish project context

1. Locate the project root by confirming:
   - `package.json` has `displayName: 天陽的漢堡工廠`.
   - `src/game/Branding.ts` and `src/game/GameTuning.ts` exist.
   - `docs/DEVELOPMENT.md` and `docs/TECHNICAL.md` exist.
2. Read both documents completely before changing behavior.
3. Inspect the current worktree and preserve unrelated user changes.
4. Read only source files relevant to the requested subsystem.
5. When `.openai/hosting.json` exists, load and follow `sites-building` before inspecting or editing the Site.
6. Treat code and tests as authoritative if documentation is stale; update affected documentation in the same change.

## Preserve the V1 gameplay contract

Keep these invariants unless the user explicitly requests a rule-breaking redesign:

- Map the entire left gameplay half to `FINISH`.
- Map the entire right gameplay half to `RETURN`.
- Keep this mapping unchanged in Portrait and Landscape.
- Dispatch on `pointerdown`, not `click` or `pointerup`.
- Use pointer X only to choose the action; never use it to select a FoodItem.
- Select the closest actionable item inside the current action zone automatically.
- Ignore input when no active item exists.
- Accept only the first simultaneous pointer and keep the lock between 30 and 50 ms.
- Consume Pause, Mute, Menu, Retry, Help, and overlay pointer events before gameplay.
- Resolve `FILLED + FINISH` and `BASE_ONLY + RETURN` as success.
- Resolve `FILLED + RETURN`, `BASE_ONLY + FINISH`, and missed deadline as immediate Game Over.
- Award score only when a capped product reaches the Inspector.
- Keep the formal game free of a visible deadline line.
- Keep food actionable from before the player station through the Inspector-side deadline.
- Rewind every active burger by exactly the same distance on RETURN.
- Use the current conveyor speed for both forward travel and line rewind.
- Rewind SpawnManager progress by the same distance to preserve spacing.
- Hide downstream capped output and retire inspected output before a line rewind.
- Distinguish complete and incomplete food by silhouette, height, layers, and broad color blocks.
- Do not add Swipe, drag, virtual joystick, a third gameplay action, health, RPG systems, or complex recipe input.

## Route work correctly

### Gameplay rules and tuning

- Put reusable conditions in `src/game/rules/`.
- Put gameplay constants in `src/game/GameTuning.ts`.
- Update `tests/game-rules.test.ts` before or with runtime changes.
- Keep difficulty driven mainly by speed.
- Preserve the initial defect rate near the V1 value unless the user requests balancing.
- Preserve the maximum consecutive rework skips or add an explicit tested replacement.

### Split input and UI priority

- Modify split mapping in `GameRules.ts` and orchestration in `SplitTouchController.ts`.
- Keep `InputManager.consumeUIEvent()` on every interactive UI pointerdown.
- Prefer `createUiButton()` for Phaser buttons.
- Test left, center boundary, right, no active item, simultaneous pointers, and consumed UI events.

### Food, deadlines, and returns

- Modify visual or state behavior in `FoodItem.ts`.
- Keep selection and timeout rules pure in `GameRules.ts`.
- Modify whole-line rewind only in `LineReturnController.ts` and its GameScene integration.
- Verify equal gaps before and after multiple rewind frames.
- Keep hidden outfeed logically eligible for Inspector scoring.

### Responsive layout and rendering

- Derive positions from `LayoutManager`; do not scatter fixed viewport coordinates through Scenes.
- Preserve Safe Area usage for HUD and overlays.
- Preserve `100dvh` with `100svh` and `100vh` fallbacks.
- Preserve `visualViewport` resize handling and orientation-safe left/right mapping.
- Keep Canvas internal dimensions equal to CSS dimensions times render scale.
- Preserve the render pixel budget and text-resolution sharpening unless tested performance evidence supports a change.

### Audio and assets

- Register every required audio asset in `AudioManager.ts` and preload it in `PreloadScene`.
- Unlock or resume AudioContext only from a real user gesture.
- Keep SFX fallbacks when decoding fails.
- Stop and disconnect obsolete BGM sources.
- Run `npm run generate:audio` after changing procedural composition.
- Bump the Service Worker cache name when core static assets change.

### Storage, tutorial, and PWA

- Keep localStorage failures non-fatal.
- Preserve Best Score and Mute during save migrations.
- Increase tutorial version only when players must repeat a materially changed tutorial.
- Keep the tutorial hands-on: complete product on the left, defective product on the right.
- Preserve `display: standalone` and `orientation: any` in the manifest.
- Keep the offline shell aligned with production assets.

### Lifecycle and restart safety

- Pause on backgrounding, blur, pagehide, and hidden visibility.
- Never auto-resume gameplay on focus or pageshow.
- Require a user gesture before resuming.
- Remove Scene timers, tweens, input listeners, lifecycle listeners, Event Bus listeners, and BGM sources during shutdown or restart.
- Reuse pooled FoodItems instead of creating unbounded entities.

## Implement safely

1. Reproduce or define the requested behavior with pure inputs where possible.
2. Add a regression test that fails before the logic change.
3. Patch the smallest coherent set of files.
4. Keep movement delta-time based and account for long frames.
5. Check both Portrait and Landscape calculations after layout changes.
6. Update `docs/DEVELOPMENT.md` for workflow, tuning, release, or acceptance changes.
7. Update `docs/TECHNICAL.md` for architecture, state, event, algorithm, schema, or runtime changes.
8. Update README links or versions only when the release surface changes.
9. Avoid unrelated dependency upgrades and architecture replacement.

## Validate

Run the full V1 gate:

```bash
npm run typecheck
npm run test:unit
npm run lint
npm run build
node --test tests/rendered-html.test.mjs
node --check public/sw.js
git diff --check
```

For gameplay changes, confirm coverage for:

- `FILLED + FINISH` and `BASE_ONLY + RETURN`.
- Both wrong actions and both missed-deadline states.
- No active item on either half.
- UI consumption and simultaneous pointers.
- Required mobile Portrait sizes and Landscape rotations.
- Equal-spacing line rewind and Spawn progress rewind.
- Downstream outfeed disposition.

Do browser, visual, or end-to-end testing only when the user explicitly requests it or the active hosting skill requires it.

## Release

1. Use semantic versioning.
2. Keep `package.json` and `package-lock.json` versions equal.
3. Bump `public/sw.js` cache name after production static-asset changes.
4. Complete the full validation gate.
5. Follow the active hosting skill for checkpointing, approval, monitoring, and direct final status verification.
6. Report completed behavior, tests, documentation changes, and optional future work.
7. Never claim true-device verification unless it actually ran.

## Deliver documentation

- Keep `docs/DEVELOPMENT.md` practical for onboarding, local work, testing, debugging, release, and extension boundaries.
- Keep `docs/TECHNICAL.md` faithful to implemented architecture, state machines, formulas, events, storage, PWA, and performance.
- Use compact Mermaid only when it materially clarifies architecture or state.
- Do not describe proposed behavior as implemented behavior.

