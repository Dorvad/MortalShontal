import { FighterData } from '../fighters/FighterData';

// ─── Tuning guide ─────────────────────────────────────────────────────────────
// walkSpeed     pixels/sec on the ground
// jumpVelocity  negative = upward; more negative = higher jump
// maxFallSpeed  terminal velocity (pixels/sec downward)
// airControl    0–1 fraction of walkSpeed while airborne
//
// Attack frame data (all values in 60fps frames):
//   startup  = wind-up before hitbox appears  (lower = faster punish)
//   active   = frames the hitbox is live      (higher = easier to hit)
//   recovery = cool-down after active ends    (higher = more punishable)
//
// hitboxOffset: { x, y, w, h }
//   x = horizontal distance from fighter origin (in facing direction)
//   y = vertical offset from feet (negative = upward)
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
  // Sprite sheet prep — swap spriteKey and verify animFrames indices when art is ready
  spriteKey: undefined,
  animFrames: {
    idle:         { start: 0,  end: 3,  frameRate: 8,  repeat: -1 },
    walk:         { start: 4,  end: 9,  frameRate: 12, repeat: -1 },
    jump:         { start: 10, end: 12, frameRate: 8,  repeat: 0  },
    light_attack: { start: 13, end: 15, frameRate: 18, repeat: 0  },
    heavy_attack: { start: 16, end: 20, frameRate: 12, repeat: 0  },
    block:        { start: 21, end: 21, frameRate: 8,  repeat: -1 },
    hitstun:      { start: 22, end: 23, frameRate: 10, repeat: 0  },
    knockdown:    { start: 24, end: 26, frameRate: 8,  repeat: 0  },
  },
};
