import { Rect } from '../utils/rects';

export type AttackId = 'light' | 'heavy';

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
  hitboxOffset: Rect;    // relative to fighter origin
}
