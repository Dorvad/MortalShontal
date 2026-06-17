import { InputState, emptyInput } from './InputState';

type AIPhase = 'approach' | 'attack' | 'block' | 'retreat';

interface FighterSnapshot {
  x: number;
  state: string;
}

export class AIInput {
  private phase: AIPhase = 'approach';
  private phaseTimer    = 0;
  private attackCooldown = 0;

  compute(delta: number, self: FighterSnapshot, opponent: FighterSnapshot): InputState {
    const input = emptyInput();
    this.phaseTimer     = Math.max(0, this.phaseTimer     - delta);
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);

    const dx    = opponent.x - self.x;   // positive → opponent is to the right of self
    const absDx = Math.abs(dx);
    const opponentAttacking = opponent.state === 'attack';

    if (this.phaseTimer <= 0) {
      if (absDx > 200) {
        this.phase = 'approach';
      } else if (opponentAttacking && Math.random() < 0.55) {
        this.phase = 'block';
        this.phaseTimer = 380;
      } else if (absDx <= 150 && this.attackCooldown <= 0) {
        this.phase = 'attack';
      } else {
        this.phase = 'approach';
      }
    }

    switch (this.phase) {
      case 'approach':
        if (dx > 0) input.right = true;
        else         input.left  = true;
        break;

      case 'attack': {
        const useHeavy = Math.random() < 0.28;
        input.heavyAttack = useHeavy;
        input.lightAttack = !useHeavy;
        this.attackCooldown = useHeavy ? 1100 : 580;
        this.phaseTimer     = this.attackCooldown * 0.85;
        this.phase = 'retreat';
        break;
      }

      case 'retreat':
        if (dx > 0) input.left  = true;
        else         input.right = true;
        break;

      case 'block':
        input.block = true;
        break;
    }

    return input;
  }
}
