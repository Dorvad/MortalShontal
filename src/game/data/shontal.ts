import { FighterData } from '../fighters/FighterData';

// Shontal — 512×512 RGBA frames, LINEAR filter
// Sprite sheets:
//   shontal_idle.png   — 3072×512, 6 frames × 512×512
//   shontal_walk.png   — 3072×512, 6 frames × 512×512
//   shontal_jump.png   — 3072×512, 6 frames × 512×512  (frames 0-2 rise, 3-5 fall)
// Single images: shontal_light1, shontal_light2, shontal_block, shontal_hitstun

export const shontalData: FighterData = {
  id: 'shontal',
  displayName: 'שונטל',
  subtitle: 'מלכת השכונה',
  maxHealth: 100,
  walkSpeed: 235,
  jumpVelocity: -740,
  maxFallSpeed: 900,
  airControl: 0.78,
  width: 48,
  height: 96,
  color: 0xd43f8d,
  hurtboxOffsetX: 0,
  hurtboxOffsetY: 0,
  hurtboxW: 44,
  hurtboxH: 88,
  attacks: {
    light: {
      id: 'light',
      damage: 9,
      knockbackX: 230,
      knockbackY: -85,
      hitstun: 15,
      blockstun: 8,
      startup: 4,
      active: 5,
      recovery: 9,
      hitboxOffset: { x: 44, y: -60, w: 68, h: 38 },
    },
    heavy: {
      id: 'heavy',
      damage: 22,
      knockbackX: 410,
      knockbackY: -150,
      hitstun: 27,
      blockstun: 15,
      startup: 13,
      active: 6,
      recovery: 23,
      hitboxOffset: { x: 38, y: -68, w: 92, h: 54 },
    },
  },
  spriteKey: 'shontal',
  spriteDisplayHeight: 208,
  spriteFilter: 'linear',
  animFrames: {
    idle:      { start: 0, end: 5, frameRate: 7,  repeat: -1 },
    walk:      { start: 0, end: 5, frameRate: 11, repeat: -1 },
    jump_rise: { start: 0, end: 2, frameRate: 10, repeat: 0  },
    jump_fall: { start: 3, end: 5, frameRate: 10, repeat: -1 },
  },
};
