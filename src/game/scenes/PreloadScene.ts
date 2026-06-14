import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

export class PreloadScene extends Phaser.Scene {
  constructor() { super(SCENES.PRELOAD); }

  preload(): void {
    // Graceful fallback: missing assets log a warning; the fighter falls back to
    // rectangle placeholders and the stage falls back to colored shapes.
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(`[PreloadScene] Could not load "${file.key}" — using placeholder.`);
    });

    // ── Stage background ─────────────────────────────────────────────────────
    this.load.image('stage_bg', 'assets/stage/bg.png');

    // ── Nahorai sprite sheets ────────────────────────────────────────────────
    // idle  — 1774×887,  6 frames × 1 row
    this.load.spritesheet('nahorai_idle', 'assets/fighters/nahorai/nahorai_idle.png', {
      frameWidth: 295, frameHeight: 883, margin: 2,
    });

    // walk  — 2172×724,  6 frames × 1 row
    this.load.spritesheet('nahorai_walk', 'assets/fighters/nahorai/nahorai_walk.png', {
      frameWidth: 362, frameHeight: 724,
    });

    // jump  — 1536×1024, 4 frames × 2 rows (rise row then fall row)
    this.load.spritesheet('nahorai_jump', 'assets/fighters/nahorai/nahorai_jump.png', {
      frameWidth: 384, frameHeight: 512,
    });

    // ── Touch controls (Kenney Mobile Controls pack) ─────────────────────────
    const ctrlPath = 'assets/ui/controls/';
    this.load.image('ctrl_btn',           ctrlPath + 'button_circle.png');
    this.load.image('ctrl_btn_hl',        ctrlPath + 'button_circle_highlight.png');
    this.load.image('ctrl_dir_left',      ctrlPath + 'direction_left.png');
    this.load.image('ctrl_dir_left_hl',   ctrlPath + 'direction_left_highlight.png');
    this.load.image('ctrl_dir_right',     ctrlPath + 'direction_right.png');
    this.load.image('ctrl_dir_right_hl',  ctrlPath + 'direction_right_highlight.png');
    this.load.image('ctrl_icon_jump',     ctrlPath + 'icon_jump.png');
    this.load.image('ctrl_icon_sword',    ctrlPath + 'icon_sword.png');
    this.load.image('ctrl_icon_fire',     ctrlPath + 'icon_fire.png');
    this.load.image('ctrl_icon_shield',   ctrlPath + 'icon_shield.png');

    // Loading bar
    const bg  = this.add.rectangle(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2, 300, 20, 0x222222).setOrigin(0, 0.5);
    const bar = this.add.rectangle(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2, 0,   20, 0x3399ff).setOrigin(0, 0.5);
    bg.setDepth(0); bar.setDepth(1);

    this.load.on('progress', (v: number) => bar.setSize(300 * v, 20));
  }

  create(): void {
    this.scene.start(SCENES.FIGHT);
    this.scene.launch(SCENES.UI);
  }
}
