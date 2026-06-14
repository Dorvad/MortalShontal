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
  animFrames?: Record<string, { start: number; end: number; frameRate: number; repeat: number }>;
}
