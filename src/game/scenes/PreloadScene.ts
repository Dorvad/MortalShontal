import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

export class PreloadScene extends Phaser.Scene {
  constructor() { super(SCENES.PRELOAD); }

  preload(): void {
    // Graceful fallback: if any asset 404s, log a warning and continue.
    // The Fighter class checks textures.exists() before using a sprite,
    // so a missing file will simply leave the rectangle placeholder active.
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(
        `[PreloadScene] Could not load "${file.key}" (${file.url}) — rectangle placeholder will be used.`
      );
    });

    // ── Nahorai idle sprite sheet ────────────────────────────────────────────
    // Drop the file at:  public/assets/fighters/nahorai/nahorai_idle.png
    //   • Frame size : 96 × 96 px
    //   • Frame count: 6 frames in a single horizontal row
    //   • Direction  : character facing RIGHT
    //   • Background : transparent (PNG)
    //
    // When this file exists the Fighter will automatically switch from
    // the rectangle to the animated sprite during the idle state.
    // All other states (walk, attack, jump, hitstun, knockdown) continue to
    // use the rectangle until their own sprite sheets are added.
    // ────────────────────────────────────────────────────────────────────────
    this.load.spritesheet(
      'nahorai_idle',
      'assets/fighters/nahorai/nahorai_idle.png',
      { frameWidth: 96, frameHeight: 96 }
    );

    // Loading bar
    const bg  = this.add.rectangle(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2, 300, 20, 0x333333).setOrigin(0, 0.5);
    const bar = this.add.rectangle(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2, 0,   20, 0x3399ff).setOrigin(0, 0.5);
    bg.setDepth(0);
    bar.setDepth(1);

    this.load.on('progress', (v: number) => bar.setSize(300 * v, 20));
  }

  create(): void {
    this.scene.start(SCENES.FIGHT);
    this.scene.launch(SCENES.UI);
  }
}
