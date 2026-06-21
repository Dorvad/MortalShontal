import { FighterData } from '../fighters/FighterData';

// ─── Sprite sheet requirements for clean integration ───────────────────────────
// 1. ALL frames in a sheet must face the SAME direction (right-facing).
//    The engine mirrors them via setFlipX when the fighter faces left.
// 2. Character centre (foot midpoint) should sit at frame_width/2 in every frame.
//    Use your export tool's "normalise pivot" or "trim to canvas" option.
// 3. All frames in a sheet should have equal height.
//    (jump frame 1 is currently 442 px vs ~580 px for the others — height pop)
// 4. Ideal export format: TexturePacker atlas (JSON + PNG).
//    Atlas carries per-frame pivot/trim data, eliminating all drift issues.
// ─────────────────────────────────────────────────────────────────────────────
// Current sheets  (public/assets/fighters/nahorai/):
//   nahorai_idle.png  — 2560×853,  6 frames × 1 row,  frameW 426  frameH 853
//   nahorai_walk.png  — 2560×852,  6 frames × 1 row,  frameW 426  frameH 852
//   nahorai_jump.png  — 2560×852,  4 frames × 1 row,  frameW 640  frameH 852
// ─────────────────────────────────────────────────────────────────────────────

export const nahoraiData: FighterData = {
  id: 'nahorai',
  displayName: 'Nahorai',
  subtitle: 'מלך השכונה',
  maxHealth: 100,
  walkSpeed: 260,
  jumpVelocity: -760,
  maxFallSpeed: 900,
  airControl: 0.85,
  width: 48,
  height: 96,
  color: 0x3399ff,
  hurtboxOffsetX: 0,
  hurtboxOffsetY: 0,
  hurtboxW: 44,
  hurtboxH: 90,
  attacks: {
    light: {
      id: 'light',
      damage: 8,
      knockbackX: 220,
      knockbackY: -90,
      hitstun: 14,
      blockstun: 7,
      startup: 3,
      active: 5,
      recovery: 8,
      hitboxOffset: { x: 40, y: -58, w: 58, h: 42 },
    },
    heavy: {
      id: 'heavy',
      damage: 22,
      knockbackX: 420,
      knockbackY: -160,
      hitstun: 28,
      blockstun: 16,
      startup: 12,
      active: 6,
      recovery: 22,
      hitboxOffset: { x: 36, y: -66, w: 88, h: 56 },
    },
  },
  spriteKey: 'nahorai',
  spriteDisplayHeight: 203,  // idle content ~629px in 853px frame → 629×(203/853)≈150px
  spriteDisplayHeightOverrides: {
    // walk frames: content ~655px in 852px → 655×(195/852)≈150px
    'nahorai_walk':         195,
    // jump frames vary; tuned to ~150px display
    'nahorai_jump_rise':    211,
    'nahorai_jump_fall':    211,
    // combat sprites are 1350px tall; scale each to show character at ~150px
    'nahorai_block':        181,   // content 1120px
    'nahorai_hitstun':      177,   // content 1139px
    'nahorai_light_attack': 178,   // content ~1135px avg across light1/light2
    // heavy sheet is 192px tall; avg content ~157px → 157×(183/192)≈153px
    'nahorai_heavy_attack': 183,
  },
  spriteFilter: 'linear',
  animFrames: {
    // Idle — use frames 0-3 only; frames 4-5 have severe drift / direction issues
    idle:         { start: 0, end: 3, frames: [0, 1, 2, 3], frameRate: 9,  repeat: -1 },
    // Walk — frames 0-2 are the right-facing phase; 3-5 appear to be the return phase
    // of a bidirectional cycle and face the wrong direction
    walk:         { start: 0, end: 2, frames: [0, 1, 2],    frameRate: 10, repeat: -1 },
    // Jump — 4 rise frames; fall holds frame 3 (airborne peak)
    jump_rise:    { start: 0, end: 3, frameRate: 10, repeat: 0  },
    jump_fall:    { start: 3, end: 3, frameRate: 10, repeat: -1 },
    // heavy_attack / knockdown — placeholder for when those sheets arrive
    heavy_attack: { start: 0, end: 4, frameRate: 12, repeat: 0 },
    knockdown:    { start: 0, end: 2, frameRate: 8,  repeat: 0 },
    // block / hitstun / light_attack handled via separate image files in Fighter.trySetupSprite()
  },
  // Per-frame x-offset compensation (source pixels) to counteract character drift
  // within the sprite sheet. Target centre = 426/2 = 213 px.
  // Formula: offset = 213 − measured_content_centre_in_frame
  // Positive = shift right; negative = shift left.
  // Tune these in-game (they scale with spriteDisplayHeight automatically).
  spriteFrameOffsets: {
    nahorai_idle: [-6, 3, 14, 21],   // halved — lerp covers the rest
    nahorai_walk: [7, -7, 24],
  },
};
