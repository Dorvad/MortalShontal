import Phaser from 'phaser';
import { FighterData } from './FighterData';
import { FighterStateName } from './FighterState';
import { InputState } from '../input/InputState';
import { Hitbox, createHitbox } from '../combat/Hitbox';
import { Hurtbox, createHurtbox } from '../combat/Hurtbox';
import { GROUND_Y, STAGE_LEFT, STAGE_RIGHT, GRAVITY } from '../utils/constants';
import { AttackData } from '../combat/AttackData';

const FPS = 60;

interface TakeHitParams {
  damage: number;
  knockbackX: number;
  knockbackY: number;
  hitstun: number;
  blockstun: number;
}

export class Fighter {
  readonly id: string;
  readonly data: FighterData;

  x: number;
  y: number;
  vx = 0;
  vy = 0;
  facing: 1 | -1 = 1; // 1 = right, -1 = left

  health: number;
  state: FighterStateName = 'idle';
  onGround = true;

  hitbox: Hitbox;
  hurtbox: Hurtbox;

  private rect: Phaser.GameObjects.Rectangle;
  private scene: Phaser.Scene;

  // State timer in frames
  private stateTimer = 0;
  private currentAttack: AttackData | null = null;
  private attackPhaseName: 'startup' | 'active' | 'recovery' | null = null;

  // Debug overlays
  private debugHurtboxRect?: Phaser.GameObjects.Rectangle;
  private debugHitboxRect?: Phaser.GameObjects.Rectangle;
  private debugLabel?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, data: FighterData, startX: number, facing: 1 | -1) {
    this.scene = scene;
    this.data = data;
    this.id = data.id;
    this.health = data.maxHealth;
    this.x = startX;
    this.y = GROUND_Y;
    this.facing = facing;

    this.hitbox  = createHitbox();
    this.hurtbox = createHurtbox();

    this.rect = scene.add.rectangle(this.x, this.y, data.width, data.height, data.color)
      .setOrigin(0.5, 1)
      .setDepth(5);

    this.initDebugOverlays();
  }

  private initDebugOverlays(): void {
    this.debugHurtboxRect = this.scene.add.rectangle(0, 0, 0, 0)
      .setStrokeStyle(2, 0x00ff00, 1)
      .setFillStyle(0x00ff00, 0.1)
      .setDepth(20)
      .setVisible(false);

    this.debugHitboxRect = this.scene.add.rectangle(0, 0, 0, 0)
      .setStrokeStyle(2, 0xff0000, 1)
      .setFillStyle(0xff0000, 0.15)
      .setDepth(20)
      .setVisible(false);

    this.debugLabel = this.scene.add.text(0, 0, '', { fontSize: '12px', color: '#ffff00' })
      .setDepth(21)
      .setVisible(false);
  }

  update(dt: number, input: InputState): void {
    const dtFrames = dt / (1000 / FPS);

    this.stateTimer = Math.max(0, this.stateTimer - dtFrames);

    switch (this.state) {
      case 'idle':    this.updateIdle(input);   break;
      case 'walk':    this.updateWalk(input);   break;
      case 'jump':    this.updateJump(input);   break;
      case 'attack':  this.updateAttack(input); break;
      case 'block':   this.updateBlock(input);  break;
      case 'hitstun': this.updateHitstun();     break;
      case 'knockdown': this.updateKnockdown(); break;
    }

    this.applyGravity(dt);
    this.applyMovement(dt);
    this.syncVisuals();
    this.syncBoxes();
  }

  private updateIdle(input: InputState): void {
    this.vx = 0;
    this.hitbox.active = false;

    if (input.block) { this.setState('block'); return; }
    if (input.lightAttack) { this.startAttack('light'); return; }
    if (input.heavyAttack) { this.startAttack('heavy'); return; }
    if (input.jump) { this.startJump(); return; }
    if (input.left || input.right) { this.setState('walk'); }
  }

  private updateWalk(input: InputState): void {
    if (input.block) { this.setState('block'); return; }
    if (input.lightAttack) { this.startAttack('light'); return; }
    if (input.heavyAttack) { this.startAttack('heavy'); return; }
    if (input.jump) { this.startJump(); return; }

    if (input.left) {
      this.vx = -this.data.walkSpeed;
      this.facing = -1;
    } else if (input.right) {
      this.vx = this.data.walkSpeed;
      this.facing = 1;
    } else {
      this.vx = 0;
      this.setState('idle');
    }
  }

  private updateJump(input: InputState): void {
    if (this.onGround) {
      this.setState('idle');
      return;
    }
    if (input.lightAttack) { this.startAttack('light'); return; }
    if (input.heavyAttack) { this.startAttack('heavy'); return; }

    if (input.left) {
      this.vx = -this.data.walkSpeed * 0.85;
      this.facing = -1;
    } else if (input.right) {
      this.vx = this.data.walkSpeed * 0.85;
      this.facing = 1;
    }
  }

  private updateAttack(input: InputState): void {
    if (!this.currentAttack) { this.setState('idle'); return; }

    const atk = this.currentAttack;
    const elapsed = (atk.startup + atk.active + atk.recovery) - this.stateTimer;
    const startupEnd  = atk.startup;
    const activeEnd   = atk.startup + atk.active;

    if (elapsed < startupEnd) {
      this.attackPhaseName = 'startup';
      this.hitbox.active = false;
    } else if (elapsed < activeEnd) {
      this.attackPhaseName = 'active';
      this.hitbox.active = true;
    } else {
      this.attackPhaseName = 'recovery';
      this.hitbox.active = false;
    }

    if (this.stateTimer <= 0) {
      this.hitbox.active = false;
      this.hitbox.hitTargets.clear();
      this.currentAttack = null;
      this.attackPhaseName = null;
      this.setState('idle');
    }

    void input;
  }

  private updateBlock(input: InputState): void {
    this.vx = 0;
    this.hitbox.active = false;
    if (!input.block) this.setState('idle');
  }

  private updateHitstun(): void {
    this.hitbox.active = false;
    if (this.stateTimer <= 0 && this.onGround) this.setState('idle');
  }

  private updateKnockdown(): void {
    this.hitbox.active = false;
    if (this.stateTimer <= 0) this.setState('idle');
  }

  private startAttack(id: 'light' | 'heavy'): void {
    const atk = this.data.attacks[id];
    if (!atk) return;

    this.currentAttack = atk;
    this.hitbox.damage     = atk.damage;
    this.hitbox.knockbackX = atk.knockbackX;
    this.hitbox.knockbackY = atk.knockbackY;
    this.hitbox.hitstun    = atk.hitstun;
    this.hitbox.blockstun  = atk.blockstun;
    this.hitbox.hitTargets.clear();
    this.hitbox.active = false;

    this.stateTimer = atk.startup + atk.active + atk.recovery;
    this.state = 'attack';
    this.vx = 0;
  }

  private startJump(): void {
    if (!this.onGround) return;
    this.vy = this.data.jumpVelocity;
    this.onGround = false;
    this.setState('jump');
  }

  private setState(s: FighterStateName): void {
    this.state = s;
    this.stateTimer = 0;
  }

  private applyGravity(dt: number): void {
    if (!this.onGround) {
      this.vy += GRAVITY * (dt / 1000);
    }
  }

  private applyMovement(dt: number): void {
    this.x += this.vx * (dt / 1000);
    this.y += this.vy * (dt / 1000);

    // Ground
    if (this.y >= GROUND_Y) {
      this.y = GROUND_Y;
      this.vy = 0;
      this.onGround = true;
    }

    // Stage walls
    const halfW = this.data.width / 2;
    this.x = Phaser.Math.Clamp(this.x, STAGE_LEFT + halfW, STAGE_RIGHT - halfW);
  }

  private syncVisuals(): void {
    this.rect.setPosition(this.x, this.y);
    this.rect.setScale(this.facing, 1);

    // Tint feedback
    if (this.state === 'hitstun') {
      this.rect.setFillStyle(0xffffff);
    } else if (this.state === 'block') {
      this.rect.setFillStyle(this.data.color).setAlpha(0.6);
    } else {
      this.rect.setFillStyle(this.data.color).setAlpha(1);
    }
  }

  private syncBoxes(): void {
    const hw = this.data.hurtboxW / 2;

    this.hurtbox.rect = {
      x: this.x - hw + this.data.hurtboxOffsetX * this.facing,
      y: this.y - this.data.hurtboxH + this.data.hurtboxOffsetY,
      w: this.data.hurtboxW,
      h: this.data.hurtboxH,
    };
    // Disable hurtbox while in knockdown
    this.hurtbox.active = this.state !== 'knockdown';

    if (this.currentAttack && this.hitbox.active) {
      const off = this.currentAttack.hitboxOffset;
      this.hitbox.rect = {
        x: this.x + off.x * this.facing - (this.facing === -1 ? off.w : 0),
        y: this.y + off.y,
        w: off.w,
        h: off.h,
      };
    }
  }

  takeHit(params: TakeHitParams): void {
    if (this.state === 'knockdown') return;

    if (this.state === 'block') {
      this.vx = -params.knockbackX * 0.3;
      this.stateTimer = params.blockstun;
      return;
    }

    this.health = Math.max(0, this.health - params.damage);
    this.vx = -params.knockbackX;
    this.vy = params.knockbackY;

    if (this.health <= 0) {
      this.state = 'knockdown';
      this.stateTimer = 90;
      this.hitbox.active = false;
      return;
    }

    this.onGround = false;
    this.state = 'hitstun';
    this.stateTimer = params.hitstun;
    this.hitbox.active = false;
  }

  setDebugVisible(visible: boolean): void {
    this.debugHurtboxRect?.setVisible(visible);
    this.debugHitboxRect?.setVisible(visible);
    this.debugLabel?.setVisible(visible);

    if (!visible) return;
    this.updateDebugOverlays();
  }

  private updateDebugOverlays(): void {
    const hurt = this.hurtbox.rect;
    this.debugHurtboxRect
      ?.setPosition(hurt.x + hurt.w / 2, hurt.y + hurt.h / 2)
      .setSize(hurt.w, hurt.h);

    if (this.hitbox.active) {
      const hb = this.hitbox.rect;
      this.debugHitboxRect
        ?.setPosition(hb.x + hb.w / 2, hb.y + hb.h / 2)
        .setSize(hb.w, hb.h)
        .setVisible(true);
    } else {
      this.debugHitboxRect?.setSize(0, 0).setVisible(false);
    }

    const phase = this.attackPhaseName ? ` [${this.attackPhaseName}]` : '';
    this.debugLabel
      ?.setPosition(this.x - 30, this.y - this.data.height - 20)
      .setText(`${this.state}${phase}`);
  }

  get attackPhaseLabel(): string | null {
    return this.attackPhaseName;
  }

  updateDebug(visible: boolean): void {
    if (!visible) {
      this.debugHurtboxRect?.setVisible(false);
      this.debugHitboxRect?.setVisible(false);
      this.debugLabel?.setVisible(false);
      return;
    }
    this.debugHurtboxRect?.setVisible(true);
    this.debugLabel?.setVisible(true);
    this.updateDebugOverlays();
  }

  destroy(): void {
    this.rect.destroy();
    this.debugHurtboxRect?.destroy();
    this.debugHitboxRect?.destroy();
    this.debugLabel?.destroy();
  }
}
