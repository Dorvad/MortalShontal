import Phaser from 'phaser';
import { Rect } from '../utils/rects';
import { GAME_WIDTH } from '../utils/constants';

export interface ProjectileSpawnData {
  x: number;
  y: number;
  vx: number;            // signed (positive = right, negative = left)
  damage: number;
  knockbackX: number;    // absolute — will be applied in the direction of travel
  knockbackY: number;
  hitstun: number;
  blockstun: number;
  hitW: number;
  hitH: number;
  spriteKey: string;
  displayScale: number;
  ownerId: string;
}

export class Projectile {
  x: number;
  y: number;
  readonly vx: number;
  readonly damage: number;
  readonly knockbackX: number;
  readonly knockbackY: number;
  readonly hitstun: number;
  readonly blockstun: number;
  readonly ownerId: string;
  readonly hitW: number;
  readonly hitH: number;
  readonly hitTargets = new Set<string>();
  active = true;

  private img: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, data: ProjectileSpawnData) {
    this.x         = data.x;
    this.y         = data.y;
    this.vx        = data.vx;
    this.damage    = data.damage;
    this.knockbackX = data.knockbackX;
    this.knockbackY = data.knockbackY;
    this.hitstun   = data.hitstun;
    this.blockstun = data.blockstun;
    this.ownerId   = data.ownerId;
    this.hitW      = data.hitW;
    this.hitH      = data.hitH;

    this.img = scene.add.image(data.x, data.y, data.spriteKey)
      .setOrigin(0.5, 0.5)
      .setDepth(7)
      .setFlipX(data.vx < 0)
      .setScale(data.displayScale);

    // Spin animation — dumbbell tumbles in flight
    scene.tweens.add({
      targets: this.img,
      angle: data.vx > 0 ? 360 : -360,
      duration: 600,
      repeat: -1,
      ease: 'Linear',
    });
  }

  get hitRect(): Rect {
    return {
      x: this.x - this.hitW / 2,
      y: this.y - this.hitH / 2,
      w: this.hitW,
      h: this.hitH,
    };
  }

  update(delta: number): void {
    if (!this.active) return;
    this.x += this.vx * delta / 1000;
    this.img.setPosition(this.x, this.y);
    if (this.x < -200 || this.x > GAME_WIDTH + 200) this.deactivate();
  }

  deactivate(): void {
    if (!this.active) return;
    this.active = false;
    this.img.destroy();
  }
}
