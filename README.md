# MortalShontal

Mobile-first 2D arcade fighting game skeleton built with Phaser 3, TypeScript, and Vite.

## Setup

```bash
npm install
```

## Running locally

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.  
For mobile testing on your local network, open `http://<your-machine-ip>:5173` on your phone (both must be on the same WiFi).

## Build for production

```bash
npm run build
npm run preview   # serve the built output locally
```

## Testing on mobile

1. Run `npm run dev` — Vite binds to `0.0.0.0` by default (`host: true` in vite.config.ts).
2. Find your machine's LAN IP: `ip addr` / `ifconfig` / System Preferences → Network.
3. Open that IP + port 5173 in your phone browser.
4. Rotate to landscape.
5. Touch controls appear automatically. The on-screen d-pad is on the left; action buttons are on the right.

For a full-screen native feel, add the page to your home screen (iOS: Share → Add to Home Screen; Android: Menu → Add to Home Screen).

## Controls

### Keyboard (desktop)

| Key | Action |
|-----|--------|
| A / D | Move left / right |
| W | Jump |
| J | Light attack |
| K | Heavy attack |
| L | Block |
| F1 | Toggle debug mode |

### Touch (mobile)

On-screen buttons appear in landscape mode. Multi-touch is supported — hold a direction while tapping attack.

## Debug mode

Press `F1` to toggle debug overlays:
- Green rectangle = hurtbox
- Red rectangle = active hitbox
- Text label above fighter = current state + attack phase (startup / active / recovery)
- FPS counter top-left

---

## Architecture overview

```
src/
  main.ts                   Entry point — creates Phaser.Game
  game/
    config.ts               Phaser game config (scenes, scaling, input)
    utils/
      constants.ts          Stage dimensions, gravity, scene keys
      rects.ts              Rect type + overlap detection
    data/
      nahorai.ts            Player fighter stats + attack frame data
      dummy.ts              Enemy fighter stats + attack frame data
    fighters/
      FighterData.ts        Interface for all fighter config (stats, hurtbox, anim frames)
      FighterState.ts       State name union type
      FighterInput.ts       Platform-agnostic input merger (keyboard + touch)
      Fighter.ts            Core fighter class: state machine, physics, box sync
    combat/
      AttackData.ts         Attack interface (startup/active/recovery/damage/knockback)
      Hitbox.ts             Active hitbox struct
      Hurtbox.ts            Passive hurtbox struct
      CombatResolver.ts     Per-frame hitbox vs hurtbox collision + takeHit dispatch
    input/
      InputState.ts         Plain boolean input snapshot
      KeyboardInput.ts      Reads Phaser keyboard keys → InputState
      TouchControls.ts      On-screen buttons → InputState (edge-detected one-shot actions)
    ui/
      HealthBar.ts          Phaser rectangles-based health bar
      TouchButton.ts        Single circular touch button with multi-pointer tracking
    scenes/
      BootScene.ts          Starts PreloadScene
      PreloadScene.ts       Asset loading (placeholder — add spritesheet loads here)
      FightScene.ts         Main game loop: fighters, combat resolver, debug
      UIScene.ts            Parallel scene: health bars, round text, KO, restart
```

---

## Adding pixel-art sprite sheets

### 1. Prepare your sprite sheet

Create a horizontal sprite sheet PNG for each fighter.  
Recommended frame size: **64 × 96 px** (adjust to your art).

### 2. Load in PreloadScene

```typescript
// src/game/scenes/PreloadScene.ts  →  preload()
this.load.spritesheet('nahorai', 'assets/nahorai.png', { frameWidth: 64, frameHeight: 96 });
```

### 3. Set `spriteKey` in fighter data

```typescript
// src/game/data/nahorai.ts
spriteKey: 'nahorai',
animFrames: {
  idle:         { start: 0,  end: 3,  frameRate: 8,  repeat: -1 },
  walk:         { start: 4,  end: 9,  frameRate: 12, repeat: -1 },
  // ... etc.
},
```

### 4. Replace the rectangle in Fighter.ts

Swap `scene.add.rectangle(...)` for `scene.add.sprite(...)` and call `this.sprite.play(animKey)` when state changes.  
Everything else — state machine, hitboxes, hurtboxes, combat — stays identical.

### 5. Recommended anim frame layout

| Animation | Frame indices | Notes |
|-----------|--------------|-------|
| idle | 0–3 | Looping |
| walk | 4–9 | Looping |
| jump | 10–12 | Once |
| light_attack | 13–15 | Once; hitbox active on frame 14 |
| heavy_attack | 16–20 | Once; hitbox active on frames 17–19 |
| block | 21 | Single pose |
| hitstun | 22–23 | Once |
| knockdown | 24–26 | Once |

---

## Next development steps

1. **Add real sprite sheets** — see "Adding pixel-art sprite sheets" above.
2. **Basic enemy AI** — simple decision tree (walk toward player, attack when in range, occasionally block).
3. **Round system** — countdown timer, multi-round tracking, win screen.
4. **Sound effects** — hit sounds, block sounds, KO sound.
5. **Screen shake** on heavy hits — `this.cameras.main.shake(100, 0.01)`.
6. **Additional attacks** — crouching, aerial attacks, specials.
7. **Capacitor wrapper** — run `npm install @capacitor/core @capacitor/cli @capacitor/android` and `npx cap init` to wrap as a native app.
