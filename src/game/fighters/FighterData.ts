import { AttackData } from '../combat/AttackData';

export interface FighterData {
  id: string;
  displayName: string;
  maxHealth: number;
  walkSpeed: number;
  jumpVelocity: number;
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
