import { Rect } from '../utils/rects';

export interface Hitbox {
  rect: Rect;
  damage: number;
  knockbackX: number;
  knockbackY: number;
  hitstun: number;
  blockstun: number;
  active: boolean;
  hitTargets: Set<string>; // fighter ids already hit this swing
}

export function createHitbox(): Hitbox {
  return {
    rect: { x: 0, y: 0, w: 0, h: 0 },
    damage: 0,
    knockbackX: 0,
    knockbackY: 0,
    hitstun: 0,
    blockstun: 0,
    active: false,
    hitTargets: new Set(),
  };
}
