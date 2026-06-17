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

    // ── Main menu assets ─────────────────────────────────────────────────────
    this.load.image('menu_logo',   'assets/ui/mainmenu/logo.png');
    this.load.image('menu_blonde', 'assets/ui/mainmenu/blonde.png');
    this.load.image('menu_goth',   'assets/ui/mainmenu/goth.png');

    // ── Stage background ─────────────────────────────────────────────────────
    this.load.image('stage_bg', 'assets/stage/bg.png');

    // ── Nahorai sprite sheets ────────────────────────────────────────────────
    // idle  — 2560×853,  6 frames × 1 row  (frameW = floor(2560/6) = 426)
    this.load.spritesheet('nahorai_idle', 'assets/fighters/nahorai/nahorai_idle.png', {
      frameWidth: 426, frameHeight: 853,
    });

    // walk  — 2560×852,  6 frames × 1 row
    this.load.spritesheet('nahorai_walk', 'assets/fighters/nahorai/nahorai_walk.png', {
      frameWidth: 426, frameHeight: 852,
    });

    // jump  — 2560×852,  4 frames × 1 row  (rise only; fall holds frame 3)
    this.load.spritesheet('nahorai_jump', 'assets/fighters/nahorai/nahorai_jump.png', {
      frameWidth: 640, frameHeight: 852,
    });

    // Single-frame combat sprites (1080×1350 each)
    this.load.image('nahorai_block',   'assets/fighters/nahorai/nahorai_block.png');
    this.load.image('nahorai_light1',  'assets/fighters/nahorai/nahorai_light1.png');
    this.load.image('nahorai_light2',  'assets/fighters/nahorai/nahorai_light2.png');
    this.load.image('nahorai_hitstun', 'assets/fighters/nahorai/nahorai_hitstun.png');

    // ── Arava sprite sheets (pixel art — small frames, nearest-neighbour filter) ─
    // idle  — 192×56,  6 frames × 32px wide × 56px tall  (3 cols × 2 rows reformatted to single strip)
    this.load.spritesheet('arava_idle', 'assets/fighters/arava/arava_idle.png', {
      frameWidth: 32, frameHeight: 56,
    });
    // walk  — 128×22,  8 frames × 16px wide × 22px tall  (two rows flattened to single strip)
    this.load.spritesheet('arava_walk', 'assets/fighters/arava/arava_walk.png', {
      frameWidth: 16, frameHeight: 22,
    });
    // hitstun — 64×64, single image
    this.load.image('arava_hitstun', 'assets/fighters/arava/arava_hitstun.png');
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
    this.scene.start(SCENES.MENU);
  }
}
