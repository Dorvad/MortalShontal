import Phaser from 'phaser';

const DRAIN_SPEED = 180; // HP per second

export class HealthBar {
  private g:            Phaser.GameObjects.Graphics;
  private x:            number;
  private y:            number;
  private w:            number;
  private h:            number;
  private maxHealth:    number;
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
    _color: number,
    flipX = false,
  ) {
    this.x            = x;
    this.y            = y;
    this.w            = width;
    this.h            = height;
    this.maxHealth    = maxHealth;
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

    const ratio    = Phaser.Math.Clamp(this.displayValue / this.maxHealth, 0, 1);
    const tgtRatio = Phaser.Math.Clamp(this.targetValue  / this.maxHealth, 0, 1);
    const fillW    = Math.round(this.w * ratio);
    const tgtW     = Math.round(this.w * tgtRatio);
    const originX  = this.flipX ? this.x - this.w : this.x;

    // Dark background track
    g.fillStyle(0x1a0a10, 1);
    g.fillRect(originX, this.y, this.w, this.h);

    // Ghost buffer (damage about to drain)
    if (fillW > tgtW) {
      const ghostX = this.flipX ? originX + this.w - fillW : originX + tgtW;
      const ghostW = fillW - tgtW;
      g.fillStyle(0xff8a1e, 0.35);
      g.fillRect(ghostX, this.y, ghostW, this.h);
    }

    // Active fill — gradient: red → orange → yellow
    if (fillW > 0) {
      const barX = this.flipX ? originX + this.w - fillW : originX;
      const seg  = Math.ceil(fillW / 3);
      const rW = Math.min(seg, fillW);
      const oW = Math.min(seg, Math.max(0, fillW - seg));
      const yW = Math.max(0, fillW - seg * 2);

      if (this.flipX) {
        if (yW > 0) { g.fillStyle(0xffe24a, 1); g.fillRect(barX, this.y, yW, this.h); }
        if (oW > 0) { g.fillStyle(0xff8a1e, 1); g.fillRect(barX + yW, this.y, oW, this.h); }
        if (rW > 0) { g.fillStyle(0xe8332e, 1); g.fillRect(barX + yW + oW, this.y, rW, this.h); }
      } else {
        if (rW > 0) { g.fillStyle(0xe8332e, 1); g.fillRect(barX, this.y, rW, this.h); }
        if (oW > 0) { g.fillStyle(0xff8a1e, 1); g.fillRect(barX + rW, this.y, oW, this.h); }
        if (yW > 0) { g.fillStyle(0xffe24a, 1); g.fillRect(barX + rW + oW, this.y, yW, this.h); }
      }

      // Top highlight strip
      g.fillStyle(0xffffff, 0.28);
      g.fillRect(barX, this.y, fillW, 3);
    }

    // Border + drop shadow
    g.lineStyle(3, 0x0a0a0f, 1);
    g.strokeRect(originX, this.y, this.w, this.h);
    g.fillStyle(0x000000, 1);
    g.fillRect(originX, this.y + this.h, this.w, 3);
  }

  destroy(): void {
    this.g.destroy();
  }
}
