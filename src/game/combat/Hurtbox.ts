import { Rect } from '../utils/rects';

export interface Hurtbox {
  rect: Rect;
  active: boolean;
}

export function createHurtbox(): Hurtbox {
  return {
    rect: { x: 0, y: 0, w: 0, h: 0 },
    active: true,
  };
}
