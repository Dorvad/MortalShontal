import { FighterData } from '../fighters/FighterData';

// ─── Tuning guide ─────────────────────────────────────────────────────────────
// walkSpeed     pixels/sec on the ground
// jumpVelocity  negative = upward; more negative = higher jump
// maxFallSpeed  terminal velocity (pixels/sec downward)
// airControl    0–1 fraction of walkSpeed while airborne
//
// Sprite sheets (all in public/assets/fighters/nahorai/):
//   nahorai_idle.png  — 1774×887,  6 frames × 1 row,  frameW 295 frameH 883 margin 2
//   nahorai_walk.png  — 2172×724,  6 frames × 1 row,  frameW 362 frameH 724
//   nahorai_jump.png  — 1536×1024, 4 frames × 2 rows, frameW 384 frameH 512
//     row 0 (frames 0-3): jump startup / rising / peak
//     row 1 (frames 4-7): falling / descent / landing impact
//
// spriteDisplayHeight controls how tall the sprite renders in game pixels.
// Hurtbox and hitbox positions are independent of sprite visuals.
// ──────────────────────────────────────────────────────────────────────────────

export const nahoraiData: FighterData = {
  id: 'nahorai',
  displayName: 'Nahorai',
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
  spriteDisplayHeight: 120,
  animFrames: {
    // Idle — 6 frames looping
    idle:         { start: 0, end: 5, frameRate: 8,  repeat: -1 },
    // Walk — 6 frames looping
    walk:         { start: 0, end: 5, frameRate: 10, repeat: -1 },
    // Jump — 8 frames in two logical halves (both use nahorai_jump sheet)
    jump_rise:    { start: 0, end: 3, frameRate: 10, repeat: 0  }, // frames 0-3: takeoff → peak
    jump_fall:    { start: 4, end: 7, frameRate: 10, repeat: 0  }, // frames 4-7: fall → landing
    // Attack, block, hitstun, knockdown — placeholder indices for when sheets arrive
    light_attack: { start: 0, end: 2, frameRate: 18, repeat: 0  },
    heavy_attack: { start: 0, end: 4, frameRate: 12, repeat: 0  },
    block:        { start: 0, end: 0, frameRate: 8,  repeat: -1 },
    hitstun:      { start: 0, end: 1, frameRate: 10, repeat: 0  },
    knockdown:    { start: 0, end: 2, frameRate: 8,  repeat: 0  },
  },
};
