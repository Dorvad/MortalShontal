import Phaser from 'phaser';

export class HealthBar {
  private bg: Phaser.GameObjects.Rectangle;
  private bar: Phaser.GameObjects.Rectangle;
  private maxWidth: number;
  private maxHealth: number;

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
    this.maxWidth = width;
    this.maxHealth = maxHealth;

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
    const ratio = Phaser.Math.Clamp(current / this.maxHealth, 0, 1);
    this.bar.setSize(this.maxWidth * ratio, this.bar.height);
  }

  destroy(): void {
    this.bg.destroy();
    this.bar.destroy();
  }
}
