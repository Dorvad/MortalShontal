import { AttackData } from '../combat/AttackData';

export interface FighterData {
  id: string;
  displayName: string;
  maxHealth: number;
  walkSpeed: number;
  jumpVelocity: number;
  maxFallSpeed: number;
  airControl: number;       // 0–1 multiplier applied to walkSpeed while airborne
  width: number;
  height: number;
  color: number;
  hurtboxOffsetX: number;
  hurtboxOffsetY: number;
  hurtboxW: number;
  hurtboxH: number;
  attacks: Record<string, AttackData>;
  // sprite sheet prep — unused until art is added
  spriteKey?: string;
  animFrames?: Record<string, { start: number; end: number; frameRate: number; repeat: number }>;
}
