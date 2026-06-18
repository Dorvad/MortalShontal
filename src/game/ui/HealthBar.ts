import Phaser from 'phaser';

export class HealthBar {
  private bg:           Phaser.GameObjects.Rectangle;
  private bar:          Phaser.GameObjects.Rectangle;
  private maxWidth:     number;
  private maxHealth:    number;
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
    this.maxWidth     = width;
    this.maxHealth    = maxHealth;
    this.targetValue  = maxHealth;
    this.displayValue = maxHealth;

    const originX = flipX ? 1 : 0;

    this.bg = scene.add.rectangle(x, y, width, height, 0x333333)
      .setOrigin(originX, 0)
      .setScrollFactor(0)
      .setDepth(30);

    this.bar = scene.add.rectangle(x, y, width, height, color)
      .setOrigin(originX, 0)
      .setScrollFactor(0)
      .setDepth(31);
  }

  setValue(current: number): void {
    this.targetValue = Phaser.Math.Clamp(current, 0, this.maxHealth);
  }

  update(delta: number): void {
    const DRAIN_SPEED = 180; // game-units (hp) per second
    const diff = this.targetValue - this.displayValue;
    if (Math.abs(diff) < 0.1) {
      this.displayValue = this.targetValue;
    } else {
      const step = Math.sign(diff) * Math.min(Math.abs(diff), DRAIN_SPEED * delta / 1000);
      this.displayValue += step;
    }
    const ratio = Phaser.Math.Clamp(this.displayValue / this.maxHealth, 0, 1);
    this.bar.setSize(this.maxWidth * ratio, this.bar.height);
  }

  destroy(): void {
    this.bg.destroy();
    this.bar.destroy();
  }
}
