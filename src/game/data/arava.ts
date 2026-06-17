import { FighterData } from '../fighters/FighterData';

// Arava — pixel-art sprite sheets (small, upscaled with NEAREST filter)
// Sprite sheet dimensions after reformatting:
//   arava_idle.png    — 192×56,  6 frames × 32×56  (original was 3-col × 2-row; flattened to single strip)
//   arava_walk.png    — 64×56,   4 frames × 16×56
//   arava_hitstun.png — 64×64,   1 frame  (single image)
//
// spriteDisplayHeight 170 → scale = 170/56 ≈ 3.04 for idle/walk (same scale, consistent size).
// Character body (~53–55 px in frame) appears at ~161–167 px game height ≈ Nahorai's ~170 px.

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
    idle: { start: 0, end: 5, frameRate: 8,  repeat: -1 },  // 6 frames (3 cols × 2 rows → single strip)
    walk: { start: 0, end: 7, frameRate: 12, repeat: -1 },  // 8 frames (2 rows × 4 cols → single strip)
    // hitstun handled via registerSingle (arava_hitstun.png loaded as plain image)
  },
};
