import { Rect } from '../utils/rects';

export type AttackId = 'light' | 'heavy';

export interface ProjectileConfig {
  speed: number;         // px/s (always positive; direction derived from fighter.facing)
  spriteKey: string;     // Phaser texture key for the projectile image
  displayScale: number;  // how much to scale the projectile image
  hitW: number;          // hitbox width
  hitH: number;          // hitbox height
  launchOffsetX: number; // horizontal offset from fighter center (game px, pre-facing)
  launchOffsetY: number; // vertical offset from fighter foot (negative = up)
}

export interface AttackData {
  id: AttackId;
  damage: number;
  knockbackX: number;
  knockbackY: number;
  hitstun: number;       // frames
  blockstun: number;     // frames
  startup: number;       // frames before active
  active: number;        // frames hitbox is live
  recovery: number;      // frames after active before idle
  hitboxOffset: Rect;    // relative to fighter origin (ignored for projectile attacks)
  projectile?: ProjectileConfig; // present → attack spawns a flying projectile
}
