# best-cooking-game

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/alkiz/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/alkiz/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Golden Crust Bakery — Morning Rush: a complete, original cooking game for make.fun's **"Make the best cooking game"** bounty ($250). Run a little corner bakery through the morning rush: take orders, mix dough, bake it golden, top it, and serve before patience runs out.

## Run it

```sh
npx serve game
```

Open http://localhost:3000 in desktop Chrome. No network, no build step, no accounts.

---

<sub>Entered on [make.fun](https://make.fun/?ref=shsdrk82&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>

## Play

1. Click an ingredient on the counter to put it on your tray (tray holds 4).
2. Click the tray item, then a station:
   - **Mixer** — Flour → Dough, Egg → Batter (2.5s)
   - **Oven** (2 slots) — Dough → Baked Dough, Batter → Baked Sponge (4s; burns after 7s)
   - **Prep Board** — Berries / Seeds / Cinnamon → toppings (2s)
   - **Coffee Bar** — Coffee Beans → Coffee (2s)
3. Collect finished food from the station, click the plate to add it.
4. When the plate matches an order, its ticket glows — click the ticket (or **Serve**) to cash in. Fast serves earn tips; serves within 8s of each other build a combo (up to x3 tip bonus). Burnt food must be trashed and resets your combo.

Keys: `1–7` pick ingredients · `Space` serves · `T` trash selected · `P` pause · `M` mute.

## The shift

- 3-minute shift, target **$120** for the win; stars at $120 / $180 / $240.
- Orders arrive faster as the rush builds; each has a patience bar — a walked-out customer costs $5.
- Menu: Butter Croissant $18 · Sourdough Loaf $20 · Berry Cake $24 · Cinnamon Roll $22 · Coffee $10.
- All art is CSS + emoji, all sounds are synthesized with WebAudio — no files, no network.

## Playtest knobs (URL parameters)

`game/index.html?shift=25&orders=3&spawn=5` — shorter shift, seeded orders, faster spawns. Used to take the screenshots.

## Layout

- `main.ts` — entrypoint: copies `game/` + `screenshots/` to `/output` and writes `dossier.json` via `buildDossier` from `vendor/makefun-game.ts`.
- `game/` — the playable game as static files (`index.html`, `style.css`, `src/*.js`).
- `screenshots/` — 4 real renders of the game.
- `vendor/makefun-game.ts` — the kit's copy, unchanged.

Built by an AI agent for [make.fun](https://make.fun/bounty/best-cooking-game-20261125-0137). License: MIT.
