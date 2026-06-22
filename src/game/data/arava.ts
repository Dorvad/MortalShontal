import { FighterData } from '../fighters/FighterData';

// Arava — high-res sprites (192×192 frames, LINEAR filter)
// Sprite sheet dimensions:
//   arava_idle.png    — 1152×192, 6 frames × 192×192
//   arava_walk.png    — 1152×192, 6 frames × 192×192
//   arava_block.png   — 192×192,  single image
//   arava_hitstun.png — single image
//
// spriteDisplayHeight 190 → scale ≈ 0.99; character fills ~90% of frame → ~171px.

export const aravaData: FighterData = {
  id: 'arava',
  displayName: 'Arava',
  subtitle: 'נוודת הפסטיבל',
  maxHealth: 100,
  walkSpeed: 260,
  jumpVelocity: -760,
  maxFallSpeed: 900,
  airControl: 0.85,
  width: 48,
  height: 96,
  color: 0xffaa00,
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
  spriteKey: 'arava',
  spriteDisplayHeight: 187,  // idle content ~180px in 192px frame → 180×(187/192)≈175px
  spriteFrameOffsets: {
    arava_idle:         [-3, -4, -2, -1, 1, 3],
    arava_walk:         [2, -4, 2, 0, 1, -4],
    arava_jump_rise:    [1, -6],
    arava_jump_fall:    [7],
    arava_light_attack: [14, -5],
    arava_heavy_attack: [0, -2, -3, -4],
  },
  spriteDisplayHeightOverrides: {
    // block: 192px frame, content 171px → 171×(197/192)≈175px
    'arava_block':        197,
    // heavy: 768px frame, content ~737px → intentionally oversized (energy aura effect)
    'arava_heavy_attack': 183,
  },
  spriteFilter: 'linear',
  animFrames: {
    idle:      { start: 0, end: 5, frameRate: 9,  repeat: -1 },  // 6 frames × 192×192
    walk:      { start: 0, end: 5, frameRate: 12, repeat: -1 },  // 6 frames × 192×192
    jump_rise: { start: 0, end: 1, frameRate: 10, repeat: 0  },  // frames 0-1: takeoff → airborne
    jump_fall: { start: 2, end: 2, frameRate: 10, repeat: -1 },  // frame 2: fall/landing hold
    // block/hitstun handled via registerSingle (plain images)
  },
};
