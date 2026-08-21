# 天陽的漢堡工廠

正式版：**1.0.0**

天陽的漢堡工廠 is an original, mobile-first 2D arcade reaction game built with TypeScript, Phaser 3, Vite/Vinext, HTML5, and CSS.

The rule never changes:

- complete food -> tap anywhere on the left half to **FINISH**
- missing ingredients -> tap anywhere on the right half to **RETURN**
- one wrong decision or missed deadline ends the run

The gameplay input is full-screen and uses `pointerdown`; food is selected automatically inside the player-station action window. HUD and overlay controls consume their own pointer events.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. A phone on the same network can open the host URL when the dev server is exposed by the environment.

## Verify and build

```bash
npm run typecheck
npm run test:unit
npm run build
npm test
```

`npm test` runs TypeScript checking, deterministic gameplay and required mobile-viewport tests, a production build, and rendered HTML metadata checks.

## Debug mode

Append query parameters to the URL:

```text
?debug=1
?debug=1&seed=12345
```

Debug mode shows FPS, logical resolution, capped DPR, orientation, speed, score, spawn interval, defect rate, active food, pooled entity count, touch state, action window, deadline, safe-area bounds, and the current left/right split.

## Project map

```text
app/                     Mobile web shell, metadata, viewport and CSS
public/                  PWA manifest, service worker, icons and social card
src/main.ts              Phaser bootstrap and lifecycle cleanup
src/game/GameTuning.ts   Central gameplay and timing constants
src/game/entities/       Conveyor, food state machine and workers
src/game/rules/          Pure rules used by runtime and unit tests
src/game/scenes/         Boot, preload, menu, game and UI scenes
src/game/systems/        Input, split touch, layout, spawn, score, audio, storage
src/game/ui/             HUD, feedback, pause and game-over components
tests/                   Rule and rendered-output tests
docs/                    V1 development and technical documentation
skills/                  Portable project-maintenance skill
```

## V1 documentation

- [Development guide](docs/DEVELOPMENT.md)
- [Technical architecture](docs/TECHNICAL.md)

The project-maintenance Skill is documented under
`skills/maintain-tianyang-burger-factory/`.

## Mobile behavior

- responsive portrait and landscape station layouts
- dynamic split boundary based on the current game viewport
- safe-area insets for notches, Dynamic Island, and home indicators
- `100dvh` with `100vh` fallback; no scrolling, selection, callout, or browser touch gestures
- automatic lifecycle pause on tab/app backgrounding, with explicit tap-to-resume
- first-pointer-only multi-touch filtering and a 42 ms input lock
- two-step hands-on tutorial with a real complete order and a real returned order
- completed outfeed is hidden or retired during a line return to prevent false prompts
- localStorage best score, mute preference, and tutorial completion
- installable PWA shell with basic offline replay after a successful first load

All character art, food art, interface styling, procedural sound effects, and music sequencing are original placeholders generated in code.
