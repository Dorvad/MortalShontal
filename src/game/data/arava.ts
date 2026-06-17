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
  spriteDisplayHeight: 190,
  spriteFrameOffsets: {
    // Idle — target centre = 192/2 = 96px; offsets = 96 - measured_content_cx
    arava_idle: [-3, -8, -2, 0, 2, 6],
    // Walk — measured content centres per frame
    arava_walk: [4, -4, 2, 0, 1, -2],
    // Light attack — windup leans left (+14), kick extends right (-5)
    arava_light_attack: [14, -5],
  },
  spriteDisplayHeightOverrides: {
    // heavy frame is 1024×1536; character fills ~70% of height → 1536*0.70≈1075px real
    // to render at ~170px game height: 170/0.70 ≈ 243
    'arava_heavy_attack': 243,
  },
  spriteFilter: 'linear',
  animFrames: {
    idle: { start: 0, end: 5, frameRate: 8,  repeat: -1 },  // 6 frames × 192×192
    walk: { start: 0, end: 5, frameRate: 12, repeat: -1 },  // 6 frames × 192×192
    // block/hitstun handled via registerSingle (plain images)
  },
};
