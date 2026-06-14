import { FighterData } from '../fighters/FighterData';

// ─── Tuning guide ─────────────────────────────────────────────────────────────
// walkSpeed     pixels/sec on the ground
// jumpVelocity  negative = upward; more negative = higher jump
// maxFallSpeed  terminal velocity (pixels/sec downward)
// airControl    0–1 fraction of walkSpeed while airborne
//
// Sprite sheets (all in public/assets/fighters/nahorai/):
//   nahorai_idle.png  — 2560×853,  6 frames × 1 row,  frameW 426 frameH 853
//   nahorai_walk.png  — 2560×852,  6 frames × 1 row,  frameW 426 frameH 852
//   nahorai_jump.png  — 2560×852,  4 frames × 1 row,  frameW 640 frameH 852
//     frames 0-3: crouch/launch → rising → airborne peak
//     (fall phase holds frame 3 — no separate fall sheet yet)
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
    // Jump — 4 rise frames; fall holds the last airborne frame
    jump_rise:    { start: 0, end: 3, frameRate: 10, repeat: 0  }, // frames 0-3: crouch → airborne
    jump_fall:    { start: 3, end: 3, frameRate: 10, repeat: -1 }, // frame 3 held during descent
    // Attack, block, hitstun, knockdown — placeholder indices for when sheets arrive
    light_attack: { start: 0, end: 2, frameRate: 18, repeat: 0  },
    heavy_attack: { start: 0, end: 4, frameRate: 12, repeat: 0  },
    block:        { start: 0, end: 0, frameRate: 8,  repeat: -1 },
    hitstun:      { start: 0, end: 1, frameRate: 10, repeat: 0  },
    knockdown:    { start: 0, end: 2, frameRate: 8,  repeat: 0  },
  },
};
