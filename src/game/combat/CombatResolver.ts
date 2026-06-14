import { Fighter } from '../fighters/Fighter';
import { rectsOverlap } from '../utils/rects';

export interface HitResult {
  wasBlocked: boolean;
  attackId: string;
}

export class CombatResolver {
  resolve(attacker: Fighter, defender: Fighter): HitResult | null {
    const hb = attacker.hitbox;
    const hurt = defender.hurtbox;

    if (!hb.active || !hurt.active) return null;
    if (hb.hitTargets.has(defender.id)) return null;
    if (!rectsOverlap(hb.rect, hurt.rect)) return null;

    hb.hitTargets.add(defender.id);

    const result = defender.takeHit({
      damage:     hb.damage,
      knockbackX: hb.knockbackX * attacker.facing,
      knockbackY: hb.knockbackY,
      hitstun:    hb.hitstun,
      blockstun:  hb.blockstun,
    });

    if (result === 'immune') return null;

    return {
      wasBlocked: result === 'blocked',
      attackId:   hb.attackId,
    };
  }
}
