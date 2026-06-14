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
  private _held = false;       // true while finger is down
  private _edgeFired = false;  // latched on pointerdown, consumed by takeEdge()
  private activePointers = new Set<number>();

  constructor(cfg: TouchButtonConfig) {
    const { scene, x, y, radius, label, color } = cfg;

    this.circle = scene.add
      .circle(x, y, radius, color, 0.42)
      .setStrokeStyle(2, color, 0.85)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(10);

    this.text = scene.add
      .text(x, y, label, { fontSize: `${Math.round(radius * 0.65)}px`, color: '#ffffff' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(11);

    this.circle.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      this.activePointers.add(ptr.id);
      this._held = true;
      this._edgeFired = true; // latch: survives a frame even if finger lifts fast
    });

    scene.input.on('pointerup', (ptr: Phaser.Input.Pointer) => {
      this.activePointers.delete(ptr.id);
      if (this.activePointers.size === 0) this._held = false;
    });

    scene.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!ptr.isDown) {
        this.activePointers.delete(ptr.id);
        if (this.activePointers.size === 0) this._held = false;
      }
    });
  }

  /** True while the finger is held down. */
  get pressed(): boolean {
    return this._held;
  }

  /**
   * Returns true once per tap (rising edge), even for fast taps.
   * Clears the latch so subsequent calls return false until the next press.
   */
  takeEdge(): boolean {
    const fired = this._edgeFired;
    this._edgeFired = false;
    return fired;
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
