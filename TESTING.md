# Manual Testing Checklist

Use this checklist before every milestone and after major changes.

## Setup

- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts the Vite dev server on port 5173
- [ ] `npm run build` completes without TypeScript or Vite errors
- [ ] `npm run preview` serves the production build on port 4173

---

## Desktop — Chrome / Firefox

### Game launch
- [ ] Game loads without console errors
- [ ] Canvas is visible and centered on screen
- [ ] "FIGHT!" text appears briefly at round start
- [ ] Blue rectangle (Nahorai) appears on the left
- [ ] Red rectangle (Dummy) appears on the right
- [ ] Both health bars are visible at the top

### Keyboard controls
- [ ] **A** — Nahorai moves left
- [ ] **D** — Nahorai moves right
- [ ] **W** — Nahorai jumps
- [ ] **J** — Light attack executes (quick, short range)
- [ ] **K** — Heavy attack executes (slower, longer range)
- [ ] **L** (held) — Block activates; rectangle alpha drops; releases on key-up
- [ ] **F1** — Debug overlay toggles on/off

### Debug mode (F1)
- [ ] Green outline appears on each fighter (hurtbox)
- [ ] Red rectangle appears on active hitbox during attack
- [ ] State label shows above each fighter (idle / walk / jump / attack / …)
- [ ] Attack phase shows: `startup [N/total]`, `active [N/total] ✓HIT`, `recovery [N/total]`
- [ ] Debug panel (top-left) shows: FPS, both fighter states, velocities, HP
- [ ] Hitbox disappears after `active` frames end
- [ ] ✓HIT marker appears after hitbox connects

### Combat tests
- [ ] Light attack hits Dummy and causes brief knockback
- [ ] Heavy attack hits Dummy with more knockback and a camera shake
- [ ] Both fighters freeze briefly on hit (hitstop)
- [ ] Dummy flashes white on hit
- [ ] Block reduces knockback and shows blue flash
- [ ] Block does NOT work if Dummy is turned away (back-hit goes through)
- [ ] During hitstun, Dummy slides then decelerates
- [ ] Dummy cannot attack while in hitstun
- [ ] KO state reached when Dummy reaches 0 HP
- [ ] "K.O." and "YOU WIN!" text appear after KO
- [ ] Pressing Space or Enter restarts the round

### Movement & physics
- [ ] Jump rises then falls naturally (no infinite float)
- [ ] Holding A/D in air gives partial air control
- [ ] Fighters stop at stage edges (left wall ≈ x:60, right wall ≈ x:900)
- [ ] Landing causes brief wide-squash on the rectangle
- [ ] Attack startup shows a lean-back (narrow rectangle)
- [ ] Attack active shows a lunge (wide rectangle)

---

## Mobile — Android phone (Chrome, landscape)

### Game launch
- [ ] Open `http://<YOUR_LAN_IP>:5173` in Chrome
- [ ] Rotate device to **landscape** before or after loading
- [ ] Canvas fills the screen and is centered
- [ ] No browser UI (address bar) visible after first tap
- [ ] No page scroll or bounce on drag
- [ ] No zoom on double-tap
- [ ] No text selection on long-press

### Touch controls layout
- [ ] Left ◀ button visible bottom-left
- [ ] Right ▶ button visible bottom-left (right of ◀)
- [ ] Up ▲ (jump) button visible above the movement pair
- [ ] BLK (block) button visible bottom-right area
- [ ] L (light) button visible bottom-right
- [ ] H (heavy) button visible above the action pair
- [ ] All buttons are comfortably large (radius ≈42 px at 1:1)
- [ ] Buttons do not overlap health bars or the fighters

### Multi-touch
- [ ] Hold ◀ while tapping L → Nahorai moves left AND performs light attack
- [ ] Hold ▶ while tapping H → Nahorai moves right AND performs heavy attack
- [ ] Hold BLK with one finger, tap H with another → block absorbs the hit
- [ ] Jump (▲) while holding ◀ or ▶ → airborne movement responds correctly

### One-shot action detection
- [ ] Quick single tap on L triggers light attack even if finger lifts fast
- [ ] Quick single tap on H triggers heavy attack even if finger lifts fast
- [ ] Quick tap on ▲ triggers jump even if finger lifts before next frame

### Combat (touch)
- [ ] Light attack connects with Dummy (hitbox debug confirms)
- [ ] Heavy attack causes camera shake
- [ ] Block reduces damage when holding BLK
- [ ] KO reached after enough hits
- [ ] Tap anywhere to restart after KO

---

## Mobile — Android tablet (Chrome, landscape)

- [ ] Game scales correctly — canvas is centered, no clipping
- [ ] Touch buttons are still reachable at larger screen size
- [ ] Multi-touch works (same tests as phone above)
- [ ] No layout overflow

---

## Mobile — iPhone (Safari, landscape)

- [ ] Game loads without errors
- [ ] No iOS Safari bounce / overscroll
- [ ] No callout popup on long-press
- [ ] Home indicator bar at bottom does not cover controls
- [ ] Add to Home Screen → game launches full-screen in landscape

---

## Deployment verification

- [ ] `npm run build` produces `dist/` with `index.html` and `assets/`
- [ ] `npm run preview` serves the built output on port 4173
- [ ] Opening `dist/index.html` directly in browser loads the game (base: './')
- [ ] After Vercel deployment: game loads at the Vercel URL
- [ ] After Vercel deployment: no 404 errors in the network tab

---

## Sprite integration check (when nahorai_idle.png is added)

- [ ] File placed at `public/assets/fighters/nahorai/nahorai_idle.png`
- [ ] Game loads without errors
- [ ] Blue rectangle disappears during idle; sprite animation plays instead
- [ ] Rectangle reappears when Nahorai walks, attacks, jumps, or is hit
- [ ] Sprite flips horizontally when Nahorai faces left
- [ ] Hit flash (white tint) is visible on the sprite when struck
- [ ] Hitbox/hurtbox debug overlays still appear correctly over the sprite
