import { FighterData } from '../fighters/FighterData';

// Arava — pixel-art sprite sheets (small, upscaled with NEAREST filter)
// Sprite sheet dimensions after reformatting:
//   arava_idle.png  — 96×120,   3 frames × 32×120  (bottom 8 empty rows trimmed → feet at frame edge)
//   arava_walk.png  — 64×56,    4 frames × 16×56   (bottom 8 empty rows trimmed)
//   arava_hitstun.png — 64×64,  1 frame  (5 empty rows at bottom — minor float, acceptable for now)
//
// spriteDisplayHeight 170 → scale = 170/120 ≈ 1.42.  Character body (~112 px in frame) appears
// at ~159 px game height — slightly shorter than Nahorai (~170 px) due to frame proportions.

export const aravaData: FighterData = {
  id: 'arava',
  displayName: 'Arava',
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
  spriteDisplayHeight: 170,
  spriteFilter: 'nearest',
  animFrames: {
    idle: { start: 0, end: 2, frameRate: 8,  repeat: -1 },
    walk: { start: 0, end: 3, frameRate: 12, repeat: -1 },
    // hitstun handled via registerSingle (arava_hitstun.png loaded as plain image)
  },
};
