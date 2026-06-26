import { FighterData } from '../fighters/FighterData';

// ── Tomer sprite sheets (public/assets/fighters/tomer/) ───────────────────────
//   tomer_idle.png     — 768×192,   4 frames × 192×192
//   tomer_walk.png     — 960×192,   5 frames × 192×192
//   tomer_heavy.png    — 960×192,   5 frames × 192×192 (dumbbell throw)
//   tomer_dumbbell.png — 86×56,     projectile sprite
//   tomer_block.png    — 256×256,   single image; content 241px → override 186
//   tomer_light1.png   — 256×256,   light attack frame 1; content 221px → override 203
//   tomer_light2.png   — 256×256,   light attack frame 2; content 221px → override 203
//   tomer_hitstun.png  — 256×256,   hitstun; content 222px → override 202
// ─────────────────────────────────────────────────────────────────────────────

export const tomerData: FighterData = {
  id: 'tomer',
  displayName: 'Tomer',
  subtitle: 'חיית החדר כושר',
  maxHealth: 100,
  walkSpeed: 250,
  jumpVelocity: -750,
  maxFallSpeed: 900,
  airControl: 0.85,
  width: 48,
  height: 96,
  color: 0x22cc66,
  hurtboxOffsetX: 0,
  hurtboxOffsetY: 0,
  hurtboxW: 44,
  hurtboxH: 90,
  attacks: {
    light: {
      id: 'light',
      damage: 9,
      knockbackX: 230,
      knockbackY: -95,
      hitstun: 14,
      blockstun: 7,
      startup: 3,
      active: 5,
      recovery: 8,
      hitboxOffset: { x: 42, y: -58, w: 58, h: 42 },
    },
    heavy: {
      id: 'heavy',
      damage: 20,
      knockbackX: 400,
      knockbackY: -120,
      hitstun: 26,
      blockstun: 14,
      startup: 10,  // frames 0-1 of throw animation (windup + pullback)
      active: 4,    // frame 2 (release) — projectile spawns here
      recovery: 18, // frames 3-4 (follow-through + recovery)
      hitboxOffset: { x: 0, y: 0, w: 0, h: 0 }, // no melee hitbox; projectile carries damage
      projectile: {
        speed: 620,
        spriteKey: 'tomer_dumbbell',
        displayScale: 1.0,
        hitW: 54,
        hitH: 36,
        launchOffsetX: 52,  // ~arm-tip distance forward in game px
        launchOffsetY: -95, // about mid-torso height
      },
    },
  },
  spriteKey: 'tomer',
  spriteDisplayHeight: 192,  // idle content 175px in 192px frame → 175×(192/192)=175px
  spriteDisplayHeightOverrides: {
    'tomer_block':        186,  // 256px frame, content 241px → 241×(186/256)≈175px
    'tomer_light_attack': 203,  // 256px frame, content 221px → 221×(203/256)≈175px
    'tomer_hitstun':      202,  // 256px frame, content 222px → 222×(202/256)≈175px
    'tomer_jump_rise':    232,  // 256px frame, content 193px → 193×(232/256)≈175px
    'tomer_jump_fall':    227,  // 256px frame, content 197px → 197×(227/256)≈175px
  },
  spriteFilter: 'linear',
  animFrames: {
    idle:      { start: 0, end: 3, frameRate: 10, repeat: -1 },
    walk:      { start: 0, end: 4, frameRate: 11, repeat: -1 },
    jump_rise: { start: 0, end: 1, frameRate: 10, repeat: 0  },  // frames 0-1: takeoff → airborne
    jump_fall: { start: 2, end: 2, frameRate: 10, repeat: -1 },  // frame 2: fall/landing hold
  },
  // Per-frame x-offset compensation (source pixels). Target centre = 256/2 = 128 px for 256px frames.
  // For 192px frames target centre = 96 px. Positive = shift right; negative = shift left.
  spriteFrameOffsets: {
    tomer_idle:         [ 3,  3,  0,  0],
    tomer_walk:         [ 7,  0, -8, -9,  2],
    tomer_heavy_attack: [-3, -5,  4,  6,  8],
    tomer_light_attack: [ 7,  3],
    tomer_hitstun:      [-5],
    tomer_jump_rise:    [+1, +4],  // frame 0: offset +1, frame 1: offset +4
    tomer_jump_fall:    [-5],       // frame 2: offset -5
  },
};
