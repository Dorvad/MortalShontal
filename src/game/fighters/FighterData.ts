import { AttackData } from '../combat/AttackData';

export interface FighterData {
  id: string;
  displayName: string;
  maxHealth: number;
  walkSpeed: number;
  jumpVelocity: number;
  maxFallSpeed: number;
  airControl: number;
  width: number;
  height: number;
  color: number;
  hurtboxOffsetX: number;
  hurtboxOffsetY: number;
  hurtboxW: number;
  hurtboxH: number;
  attacks: Record<string, AttackData>;
  // sprite sheet prep
  spriteKey?: string;
  spriteDisplayHeight?: number; // visual height in game pixels; controls sprite scale
  animFrames?: Record<string, {
    start: number;
    end: number;
    frames?: number[]; // explicit frame list — overrides start/end when present
    frameRate: number;
    repeat: number;
  }>;
  // Per-frame horizontal anchor compensation in source pixels, applied ×scale each frame.
  // Keys are full Phaser anim keys (e.g. 'nahorai_idle'); values indexed by spritesheet frame #.
  spriteFrameOffsets?: Record<string, number[]>;
}
