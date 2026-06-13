import Phaser from 'phaser';

export interface TouchButtonConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  radius: number;
  label: string;
  color: number;
}

export class TouchButton {
  private circle: Phaser.GameObjects.Arc;
  private text: Phaser.GameObjects.Text;
  private _pressed = false;
  private activePointers = new Set<number>();

  constructor(cfg: TouchButtonConfig) {
    const { scene, x, y, radius, label, color } = cfg;

    this.circle = scene.add
      .circle(x, y, radius, color, 0.45)
      .setStrokeStyle(2, color, 0.9)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(10);

    this.text = scene.add
      .text(x, y, label, { fontSize: `${Math.round(radius * 0.7)}px`, color: '#ffffff' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(11);

    this.circle.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      this.activePointers.add(ptr.id);
      this._pressed = true;
    });

    scene.input.on('pointerup', (ptr: Phaser.Input.Pointer) => {
      this.activePointers.delete(ptr.id);
      if (this.activePointers.size === 0) this._pressed = false;
    });

    scene.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!ptr.isDown) {
        this.activePointers.delete(ptr.id);
        if (this.activePointers.size === 0) this._pressed = false;
      }
    });
  }

  get pressed(): boolean {
    return this._pressed;
  }

  consumePress(): boolean {
    if (this._pressed) {
      this._pressed = false;
      this.activePointers.clear();
      return true;
    }
    return false;
  }

  setVisible(v: boolean): void {
    this.circle.setVisible(v);
    this.text.setVisible(v);
  }

  destroy(): void {
    this.circle.destroy();
    this.text.destroy();
  }
}
