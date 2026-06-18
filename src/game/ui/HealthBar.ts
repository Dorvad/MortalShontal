import Phaser from 'phaser';

const N_SEGMENTS  = 20;
const SEG_GAP     = 2;    // px gap between cells
const DRAIN_SPEED = 180;  // HP per second

export class HealthBar {
  private g:            Phaser.GameObjects.Graphics;
  private x:            number;
  private y:            number;
  private w:            number;
  private h:            number;
  private maxHealth:    number;
  private color:        number;
  private flipX:        boolean;
  private targetValue:  number;
  private displayValue: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    maxHealth: number,
    color: number,
    flipX = false,
  ) {
    this.x = x; this.y = y; this.w = width; this.h = height;
    this.maxHealth    = maxHealth;
    this.color        = color;
    this.flipX        = flipX;
    this.targetValue  = maxHealth;
    this.displayValue = maxHealth;

    this.g = scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(31);

    this.draw();
  }

  setValue(current: number): void {
    this.targetValue = Phaser.Math.Clamp(current, 0, this.maxHealth);
  }

  update(delta: number): void {
    const diff = this.targetValue - this.displayValue;
    if (Math.abs(diff) < 0.1) {
      this.displayValue = this.targetValue;
    } else {
      const step = Math.sign(diff) * Math.min(Math.abs(diff), DRAIN_SPEED * delta / 1000);
      this.displayValue += step;
    }
    this.draw();
  }

  private draw(): void {
    const g = this.g;
    g.clear();

    const segW        = (this.w - (N_SEGMENTS - 1) * SEG_GAP) / N_SEGMENTS;
    const displaySegs = Math.ceil(Phaser.Math.Clamp(this.displayValue / this.maxHealth, 0, 1) * N_SEGMENTS);
    const targetSegs  = Math.ceil(Phaser.Math.Clamp(this.targetValue  / this.maxHealth, 0, 1) * N_SEGMENTS);
    const isCritical  = targetSegs <= Math.floor(N_SEGMENTS * 0.25);

    for (let i = 0; i < N_SEGMENTS; i++) {
      const segX = this.flipX
        ? this.x - (i + 1) * segW - i * SEG_GAP
        : this.x + i * (segW + SEG_GAP);

      if (i < targetSegs) {
        const fill = isCritical ? 0xff3b30 : this.color;
        g.fillStyle(fill, 1);
        g.fillRect(segX, this.y, segW, this.h);
        // frosted top-strip highlight
        g.fillStyle(0xffffff, 0.22);
        g.fillRect(segX, this.y, segW, 3);
      } else if (i < displaySegs) {
        // ghost buffer — shows HP being drained
        g.fillStyle(this.color, 0.25);
        g.fillRect(segX, this.y, segW, this.h);
      } else {
        // empty cell
        g.fillStyle(0x111122, 1);
        g.fillRect(segX, this.y, segW, this.h);
        g.lineStyle(1, 0x333355, 1);
        g.strokeRect(segX, this.y, segW, this.h);
      }
    }
  }

  destroy(): void {
    this.g.destroy();
  }
}
