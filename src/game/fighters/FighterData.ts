import { AttackData } from '../combat/AttackData';

export interface FighterData {
  id: string;
  displayName: string;
  subtitle?: string;
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
  spriteDisplayHeight?: number;       // visual height in game pixels; controls sprite scale
  spriteDisplayHeightOverrides?: Record<string, number>; // per-anim overrides (e.g. for heavy attack)
  spriteFilter?: 'linear' | 'nearest'; // LINEAR for hi-res art (default), NEAREST for pixel art
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
