import { FighterData } from '../fighters/FighterData';

// ── Tomer sprite sheets (public/assets/fighters/tomer/) ───────────────────────
//   tomer_idle.png  — 768×192,   4 frames × 192×192
//   tomer_walk.png  — 960×192,   5 frames × 192×192
// ─────────────────────────────────────────────────────────────────────────────

export const tomerData: FighterData = {
  id: 'tomer',
  displayName: 'Tomer',
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
      knockbackY: -150,
      hitstun: 26,
      blockstun: 15,
      startup: 12,
      active: 6,
      recovery: 22,
      hitboxOffset: { x: 38, y: -64, w: 86, h: 54 },
    },
  },
  spriteKey: 'tomer',
  spriteDisplayHeight: 185,
  spriteFilter: 'linear',
  animFrames: {
    idle: { start: 0, end: 3, frameRate: 7, repeat: -1 },
    walk: { start: 0, end: 4, frameRate: 10, repeat: -1 },
  },
  // Per-frame x-offset compensation (source pixels). Target centre = 192/2 = 96 px.
  // Positive = shift right; negative = shift left.
  spriteFrameOffsets: {
    tomer_idle: [ 5,  5,  1, -1],
    tomer_walk: [ 7,  1, -8, -9,  2],
  },
};
