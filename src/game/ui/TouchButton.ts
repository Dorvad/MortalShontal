import Phaser from 'phaser';

export interface TouchButtonConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  size: number;        // display size in game pixels (width & height)
  baseKey: string;     // texture key for normal state
  highlightKey: string; // texture key for pressed overlay
  iconKey?: string;    // optional icon drawn on top
  iconSize?: number;   // icon display size; defaults to size * 0.55
}

export class TouchButton {
  private base: Phaser.GameObjects.Image;
  private highlight: Phaser.GameObjects.Image;
  private icon?: Phaser.GameObjects.Image;

  private _held = false;
  private _edgeFired = false;
  private activePointers = new Set<number>();

  constructor(cfg: TouchButtonConfig) {
    const { scene, x, y, size, baseKey, highlightKey, iconKey, iconSize } = cfg;

    this.base = scene.add.image(x, y, baseKey)
      .setDisplaySize(size, size)
      .setScrollFactor(0)
      .setDepth(10)
      .setAlpha(0.82)
      .setInteractive();

    this.highlight = scene.add.image(x, y, highlightKey)
      .setDisplaySize(size, size)
      .setScrollFactor(0)
      .setDepth(11)
      .setVisible(false);

    if (iconKey) {
      const is = iconSize ?? Math.round(size * 0.55);
      this.icon = scene.add.image(x, y, iconKey)
        .setDisplaySize(is, is)
        .setScrollFactor(0)
        .setDepth(12)
        .setAlpha(0.9);
    }

    this.base.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      this.activePointers.add(ptr.id);
      this._held = true;
      this._edgeFired = true;
      this.highlight.setVisible(true);
    });

    scene.input.on('pointerup', (ptr: Phaser.Input.Pointer) => {
      this.activePointers.delete(ptr.id);
      if (this.activePointers.size === 0) {
        this._held = false;
        this.highlight.setVisible(false);
      }
    });

    scene.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!ptr.isDown) {
        this.activePointers.delete(ptr.id);
        if (this.activePointers.size === 0) {
          this._held = false;
          this.highlight.setVisible(false);
        }
      }
    });
  }

  get pressed(): boolean {
    return this._held;
  }

  takeEdge(): boolean {
    const fired = this._edgeFired;
    this._edgeFired = false;
    return fired;
  }

  setVisible(v: boolean): void {
    this.base.setVisible(v);
    this.highlight.setVisible(v ? this._held : false);
    this.icon?.setVisible(v);
  }

  destroy(): void {
    this.base.destroy();
    this.highlight.destroy();
    this.icon?.destroy();
  }
}
