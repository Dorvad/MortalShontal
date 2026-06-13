import { Fighter } from '../fighters/Fighter';
import { rectsOverlap } from '../utils/rects';

export class CombatResolver {
  resolve(attacker: Fighter, defender: Fighter): void {
    const hb = attacker.hitbox;
    const hurt = defender.hurtbox;

    if (!hb.active || !hurt.active) return;
    if (hb.hitTargets.has(defender.id)) return;
    if (!rectsOverlap(hb.rect, hurt.rect)) return;

    hb.hitTargets.add(defender.id);
    defender.takeHit({
      damage:     hb.damage,
      knockbackX: hb.knockbackX * attacker.facing,
      knockbackY: hb.knockbackY,
      hitstun:    hb.hitstun,
      blockstun:  hb.blockstun,
    });
  }
}
