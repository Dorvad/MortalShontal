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

    // ── Main menu / UI assets ────────────────────────────────────────────────
    this.load.image('menu_logo',   'assets/ui/mainmenu/logo.png');
    this.load.image('menu_night',  'assets/ui/mainmenu/night.png');

    // ── Character card illustrations (for select / menu) ─────────────────────
    this.load.image('card_arava',   'assets/ui/characters/arava_card.png');
    this.load.image('card_tomer',   'assets/ui/characters/tomer_card.png');
    this.load.image('card_nahorai', 'assets/ui/characters/nahorai_card.png');
    this.load.image('card_shontal', 'assets/ui/characters/shontal_card.png');

    // ── Character splash art (full-body portraits for select screen) ──────────
    this.load.image('splash_nahorai', 'assets/ui/characters/nahorai_splash.png');
    this.load.image('splash_tomer',   'assets/ui/characters/tomer_splash.png');
    this.load.image('splash_arava',   'assets/ui/characters/arava_splash.png');
    this.load.image('splash_shontal', 'assets/ui/characters/shontal_splash.png');

    // ── Stage backgrounds ────────────────────────────────────────────────────
    this.load.image('stage_bg',       'assets/stage/bg_day.png');
    this.load.image('stage_bg_night', 'assets/stage/bg_night.png');
    this.load.image('stage_telaviv',  'assets/stage/stage_telaviv.png');
    this.load.image('stage_campus',   'assets/stage/stage_campus.png');
    this.load.image('stage_festival', 'assets/stage/stage_festival.png');

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

    // Heavy attack — 1152×192, 6 frames × 192px
    this.load.spritesheet('nahorai_heavy', 'assets/fighters/nahorai/nahorai_heavy.png', {
      frameWidth: 192, frameHeight: 192,
    });

    // ── Arava sprite sheets ──────────────────────────────────────────────────
    // idle  — 1152×192, 6 frames × 192×192 (high-res)
    this.load.spritesheet('arava_idle', 'assets/fighters/arava/arava_idle.png', {
      frameWidth: 192, frameHeight: 192,
    });
    // walk  — 1152×192, 6 frames × 192×192 (high-res)
    this.load.spritesheet('arava_walk', 'assets/fighters/arava/arava_walk.png', {
      frameWidth: 192, frameHeight: 192,
    });
    // block — 192×192, single image (high-res)
    this.load.image('arava_block', 'assets/fighters/arava/arava_block.png');
    // heavy attack — 2048×768, 4 frames × 512×768 (resized for performance)
    this.load.spritesheet('arava_heavy', 'assets/fighters/arava/arava_heavy.png', {
      frameWidth: 512, frameHeight: 768,
    });
    // jump — 576×192, 3 frames × 192×192 (high-res)
    this.load.spritesheet('arava_jump', 'assets/fighters/arava/arava_jump.png', {
      frameWidth: 192, frameHeight: 192,
    });
    // light attack — 192×192 each (high-res)
    this.load.image('arava_light1', 'assets/fighters/arava/arava_light1.png');
    this.load.image('arava_light2', 'assets/fighters/arava/arava_light2.png');
    // hitstun — 64×64, single image
    this.load.image('arava_hitstun', 'assets/fighters/arava/arava_hitstun.png');

    // ── Shontal sprite sheets ────────────────────────────────────────────────
    // idle  — 3072×512, 6 frames × 512×512
    this.load.spritesheet('shontal_idle', 'assets/fighters/shontal/shontal_idle.png', {
      frameWidth: 512, frameHeight: 512,
    });
    // walk  — 3072×512, 6 frames × 512×512
    this.load.spritesheet('shontal_walk', 'assets/fighters/shontal/shontal_walk.png', {
      frameWidth: 512, frameHeight: 512,
    });
    // jump  — 3072×512, 6 frames × 512×512 (frames 0-2 rise, 3-5 fall)
    this.load.spritesheet('shontal_jump', 'assets/fighters/shontal/shontal_jump.png', {
      frameWidth: 512, frameHeight: 512,
    });
    // heavy — 2560×512, 5 frames × 512×512 (frames 0-1 startup, 2-3 active, 4 recovery)
    this.load.spritesheet('shontal_heavy', 'assets/fighters/shontal/shontal_heavy.png', {
      frameWidth: 512, frameHeight: 512,
    });
    this.load.image('shontal_light1',  'assets/fighters/shontal/shontal_light1.png');
    this.load.image('shontal_light2',  'assets/fighters/shontal/shontal_light2.png');
    this.load.image('shontal_block',   'assets/fighters/shontal/shontal_block.png');
    this.load.image('shontal_hitstun', 'assets/fighters/shontal/shontal_hitstun.png');

    // ── Tomer sprite sheets ──────────────────────────────────────────────────
    // idle  — 768×192, 4 frames × 192×192
    this.load.spritesheet('tomer_idle', 'assets/fighters/tomer/tomer_idle.png', {
      frameWidth: 192, frameHeight: 192,
    });
    // walk  — 960×192, 5 frames × 192×192
    this.load.spritesheet('tomer_walk', 'assets/fighters/tomer/tomer_walk.png', {
      frameWidth: 192, frameHeight: 192,
    });
    // heavy attack (dumbbell throw) — 960×192, 5 frames × 192×192
    this.load.spritesheet('tomer_heavy', 'assets/fighters/tomer/tomer_heavy.png', {
      frameWidth: 192, frameHeight: 192,
    });
    // dumbbell projectile — 86×56
    this.load.image('tomer_dumbbell', 'assets/fighters/tomer/tomer_dumbbell.png');
    // jump — 768×256, 3 frames × 256×256
    this.load.spritesheet('tomer_jump', 'assets/fighters/tomer/tomer_jump.png', {
      frameWidth: 256, frameHeight: 256,
    });
    // block — 256×256, single image
    this.load.image('tomer_block',   'assets/fighters/tomer/tomer_block.png');
    // light attack frames — 256×256 each
    this.load.image('tomer_light1',  'assets/fighters/tomer/tomer_light1.png');
    this.load.image('tomer_light2',  'assets/fighters/tomer/tomer_light2.png');
    // hitstun — 256×256, single image
    this.load.image('tomer_hitstun', 'assets/fighters/tomer/tomer_hitstun.png');
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

    const label = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#555577',
    }).setOrigin(0.5).setDepth(2);

    this.load.on('progress', (v: number) => bar.setSize(300 * v, 20));
    this.load.on('fileprogress', (file: Phaser.Loader.File) => label.setText(file.key));
  }

  create(): void {
    // Generate a tiny 4×4 white square for hit-spark particles
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 4, 4);
    g.generateTexture('spark_px', 4, 4);
    g.destroy();

    this.scene.start(SCENES.MENU);
  }
}
