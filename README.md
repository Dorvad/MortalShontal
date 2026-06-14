# MortalShontal

Mobile-first 2D arcade fighting game skeleton built with Phaser 3, TypeScript, and Vite.

---

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## npm scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (hot-reload) |
| `npm run build` | TypeScript check + Vite production build → `dist/` |
| `npm run preview` | Serve the production build locally |

---

## Testing on a real mobile device

Both `dev` and `preview` bind to `0.0.0.0`, so any device on your local network can connect.

1. Run `npm run dev` on your machine.
2. Find your machine's LAN IP:
   - **macOS/Linux**: `ip addr` or `ifconfig`
   - **Windows**: `ipconfig /all`
3. On your phone (same Wi-Fi), open: `http://<YOUR_LAN_IP>:5173`
4. Rotate to **landscape**.
5. Tap once to dismiss the browser chrome — the game is touch-ready.

For the production build:
```bash
npm run build
npm run preview   # → http://<YOUR_LAN_IP>:4173
```

> **iOS full-screen tip**: Share → Add to Home Screen. Reopening from the home screen hides the browser UI and locks landscape.

---

## Deploying to Vercel

### Option A — Vercel CLI

```bash
npm install -g vercel
vercel
```

Vercel will detect Vite, use `npm run build`, and serve from `dist/`. Done.

### Option B — GitHub integration (recommended)

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project**.
3. Import the repository.
4. Vercel auto-detects the settings from `vercel.json`:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Click **Deploy**. Every `git push` re-deploys automatically.

> The `vercel.json` at the root is pre-configured. No extra settings needed.

---

## Controls

### Keyboard (desktop)

| Key | Action |
|---|---|
| A / D | Move left / right |
| W | Jump |
| J | Light attack |
| K | Heavy attack |
| L (hold) | Block |
| F1 | Toggle debug mode |

### Touch (mobile — landscape)

| Button | Position | Action |
|---|---|---|
| ◀ | Bottom-left | Move left (hold) |
| ▶ | Bottom-left | Move right (hold) |
| ▲ | Above movement | Jump (tap) |
| BLK | Bottom-right | Block (hold) |
| L | Bottom-right | Light attack (tap) |
| H | Above action | Heavy attack (tap) |

Multi-touch is fully supported — hold a direction and tap attack simultaneously.

---

## Debug mode (F1)

| Overlay | Description |
|---|---|
| Green outline | Hurtbox (passive — can be hit) |
| Red rectangle | Active hitbox (only during active frames) |
| Label above fighter | State + attack phase + frame counter |
| Top-left panel | FPS, both fighter states, velocities, HP, hitstop |

---

## Project structure

```
public/
  assets/
    fighters/
      nahorai/
        nahorai_idle.png     ← drop sprite sheet here (not yet added)
src/
  main.ts                    Entry point
  game/
    config.ts                Phaser game config (scaling, scenes, input)
    utils/
      constants.ts           Stage dims, gravity, hitstop values, scene keys
      rects.ts               Rect type + overlap test
    data/
      nahorai.ts             ← TUNE movement & attack values here
      dummy.ts               ← dummy fighter data
    fighters/
      FighterData.ts         Interface: stats, spriteKey, animFrames
      FighterState.ts        State name union
      FighterInput.ts        Keyboard + touch merger
      Fighter.ts             State machine, physics, hitboxes, sprite layer
    combat/
      AttackData.ts          Attack interface (startup/active/recovery/…)
      Hitbox.ts              Active hitbox struct
      Hurtbox.ts             Passive hurtbox struct
      CombatResolver.ts      Per-frame collision → takeHit → HitResult
    input/
      InputState.ts          Boolean input snapshot
      KeyboardInput.ts       Keyboard → InputState
      TouchControls.ts       On-screen buttons → InputState
    ui/
      HealthBar.ts           Phaser rect-based health bar
      TouchButton.ts         Touch button with edge-latch for fast taps
    scenes/
      BootScene.ts           Starts PreloadScene
      PreloadScene.ts        Asset loading (sprite sheets go here)
      FightScene.ts          Main loop: fighters, combat, debug panel
      UIScene.ts             Parallel scene: health bars, KO, restart
```

---

## Adding Nahorai's idle sprite

### 1. Create the sprite sheet

- **File**: `public/assets/fighters/nahorai/nahorai_idle.png`
- **Frame size**: 96 × 96 px
- **Frames**: 6 frames in a single horizontal row
- **Direction**: character facing **right**
- **Background**: transparent (PNG)

### 2. That's it — no code changes needed

The game already:
- Tries to load `nahorai_idle.png` in `PreloadScene.preload()`
- If the file exists, `Fighter.trySetupSprite()` creates the sprite and animation automatically
- During the `idle` state, Nahorai shows the animated sprite instead of the rectangle
- All other states (walk, attack, jump, block, hitstun, knockdown) continue to use the rectangle until you add their own sheets

### 3. Verify

1. Run `npm run dev`
2. The blue rectangle should be replaced by your sprite animation when Nahorai is idle
3. Press F1 — hurtbox and hitbox overlays still appear on top of the sprite correctly

### 4. Adding the next animation (e.g. walk)

1. Place `public/assets/fighters/nahorai/nahorai_walk.png` (same format)
2. In `PreloadScene.ts`, add: `this.load.spritesheet('nahorai_walk', 'assets/fighters/nahorai/nahorai_walk.png', { frameWidth: 96, frameHeight: 96 });`
3. In `Fighter.trySetupSprite()`, register the walk animation and add `'walk'` to the state check in `syncVisuals`

---

## Tuning values

### Movement — `src/game/data/nahorai.ts`

```ts
walkSpeed:    260,   // px/sec on ground      (try 220–300)
jumpVelocity: -760,  // initial jump velocity  (more negative = higher)
maxFallSpeed: 900,   // terminal velocity      (try 750–1100)
airControl:   0.85,  // fraction of walkSpeed in air
```

### Global physics — `src/game/utils/constants.ts`

```ts
GRAVITY = 1400       // px/sec²  (try 1100–1600)
```

### Attack frame data — `src/game/data/nahorai.ts`

```ts
light: { startup: 3, active: 5, recovery:  8, damage:  8, knockbackX: 220 }
heavy: { startup:12, active: 6, recovery: 22, damage: 22, knockbackX: 420 }
```

`startup` = frames before hitbox appears (lower = punishes faster)
`active`  = frames hitbox is live (higher = easier to connect)
`recovery`= frames after active (higher = more punishable if whiffed)

### Hitstop — `src/game/utils/constants.ts`

```ts
HITSTOP_LIGHT   = 3   // frames both fighters freeze on light hit
HITSTOP_HEAVY   = 7   // frames on heavy hit
HITSTOP_BLOCKED = 2   // frames on blocked hit
```

---

## Manual test checklist

See [TESTING.md](./TESTING.md) for the full checklist.

---

## Next development steps

1. **Add `nahorai_idle.png`** — drop into `public/assets/fighters/nahorai/` (see above)
2. **Add walk / attack / jump sprites** — follow the same pattern
3. **Basic enemy AI** — walk toward player, attack when in range, occasionally block
4. **Round system** — countdown timer, multi-round win tracking
5. **Sound effects** — hit sounds, block sounds, KO sound
6. **Capacitor wrapper** — native Android/iOS app
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init
   npx cap add android
   npm run build && npx cap sync
   ```
