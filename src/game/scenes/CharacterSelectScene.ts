import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { nahoraiData } from '../data/nahorai';
import { aravaData }   from '../data/arava';
import { tomerData }   from '../data/tomer';
import { FighterData } from '../fighters/FighterData';
import { GameSettings } from '../GameSettings';

const CHARS: FighterData[] = [nahoraiData, aravaData, tomerData];

export class CharacterSelectScene extends Phaser.Scene {
  private selecting = false;

  constructor() { super(SCENES.SELECT); }

  create(): void {
    this.selecting = false;
    this.createBackground();
    this.createHeader();
    this.createCharCards();
    this.createFooter();
    this.createScanlines();

    this.input.keyboard?.addKey('ESC').on('down', () => {
      if (this.selecting) return;
      this.cameras.main.fadeOut(300, 0, 0, 0, (_: unknown, p: number) => {
        if (p === 1) this.scene.start(SCENES.MENU);
      });
    });

    this.cameras.main.fadeIn(300);
  }

  private createBackground(): void {
    const key = 'select_bg';
    if (!this.textures.exists(key)) {
      const canvas = document.createElement('canvas');
      canvas.width  = GAME_WIDTH;
      canvas.height = GAME_HEIGHT;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(
        GAME_WIDTH / 2, GAME_HEIGHT * -0.1, 0,
        GAME_WIDTH / 2, GAME_HEIGHT / 2,    GAME_WIDTH * 0.75,
      );
      grad.addColorStop(0,    '#1a0838');
      grad.addColorStop(0.55, '#0d0b1c');
      grad.addColorStop(1,    '#050409');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.textures.addCanvas(key, canvas);
    }
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);

    // Subtle top glow
    const g = this.add.graphics().setDepth(1);
    g.fillGradientStyle(0xaa1188, 0xaa1188, 0xaa1188, 0xaa1188, 0.22, 0.22, 0, 0);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.13);
  }

  private createHeader(): void {
    this.add.text(GAME_WIDTH / 2, 30, 'SELECT YOUR FIGHTER', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '21px',
      color: '#ffd23f',
      shadow: { color: '#ff3b30', blur: 18, fill: true },
    }).setOrigin(0.5, 0.5).setDepth(5);
  }

  private createCharCards(): void {
    const CX = [GAME_WIDTH * 0.185, GAME_WIDTH * 0.50, GAME_WIDTH * 0.815];
    const cardY = GAME_HEIGHT * 0.54;
    const cardW = GAME_WIDTH  * 0.28;
    const cardH = GAME_HEIGHT * 0.82;

    CHARS.forEach((char, idx) => {
      const cx = CX[idx];

      // Dark card panel
      const card = this.add.rectangle(cx, cardY, cardW, cardH, 0x08051e, 0.88)
        .setStrokeStyle(2, 0x2233bb, 0.65)
        .setDepth(2)
        .setInteractive({ useHandCursor: true });

      // Hover glow overlay
      const glow = this.add.rectangle(cx, cardY, cardW, cardH, 0xffd23f, 0)
        .setDepth(3);

      // Animated idle sprite
      let spriteObj: Phaser.GameObjects.Sprite | undefined;
      const idleTexKey = `${char.spriteKey}_idle`;

      if (this.textures.exists(idleTexKey)) {
        spriteObj = this.add.sprite(cx, cardY + cardH * 0.36, idleTexKey)
          .setOrigin(0.5, 1)
          .setDepth(4);

        // Scale to ~72% of card height
        const targetH = cardH * 0.72;
        spriteObj.setScale(targetH / spriteObj.frame.realHeight);

        const animKey = `${char.spriteKey}_idle`;
        const af = char.animFrames?.idle;
        if (af && !this.anims.exists(animKey)) {
          this.anims.create({
            key: animKey,
            frames: af.frames
              ? this.anims.generateFrameNumbers(idleTexKey, { frames: af.frames })
              : this.anims.generateFrameNumbers(idleTexKey, { start: af.start, end: af.end }),
            frameRate: af.frameRate,
            repeat: -1,
          });
        }
        if (this.anims.exists(animKey)) spriteObj.play(animKey);
      } else {
        // Colour rectangle fallback
        this.add.rectangle(cx, cardY + cardH * 0.36, 80, 180, char.color)
          .setOrigin(0.5, 1).setDepth(4);
      }

      // Character name at top of card
      this.add.text(cx, cardY - cardH * 0.44, char.displayName.toUpperCase(), {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '17px',
        color: '#ffffff',
        shadow: { color: '#000000', blur: 6, fill: true },
      }).setOrigin(0.5, 0.5).setDepth(5);

      // Pointer interactions
      card
        .on('pointerover', () => {
          if (this.selecting) return;
          card.setStrokeStyle(2, 0xffd23f, 1);
          glow.setAlpha(0.07);
          spriteObj?.setTint(0xffffcc);
        })
        .on('pointerout', () => {
          card.setStrokeStyle(2, 0x2233bb, 0.65);
          glow.setAlpha(0);
          spriteObj?.clearTint();
        })
        .on('pointerdown', () => this.selectChar(char, cx, cardY, cardW, cardH, spriteObj));
    });

    // Subtle separators between cards
    const dividers = this.add.graphics().setDepth(2);
    dividers.lineStyle(1, 0x334488, 0.45);
    for (const sepX of [GAME_WIDTH * 0.345, GAME_WIDTH * 0.655]) {
      dividers.beginPath();
      dividers.moveTo(sepX, GAME_HEIGHT * 0.10);
      dividers.lineTo(sepX, GAME_HEIGHT * 0.96);
      dividers.strokePath();
    }
  }

  private createFooter(): void {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.975, 'ESC — BACK TO MENU', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: 'rgba(255,255,255,0.32)',
    }).setOrigin(0.5, 1).setDepth(5);
  }

  private createScanlines(): void {
    const rt = this.add.renderTexture(0, 0, GAME_WIDTH, GAME_HEIGHT).setDepth(8);
    const g  = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x000000, 0.25);
    for (let y = 0; y < GAME_HEIGHT; y += 3) g.fillRect(0, y, GAME_WIDTH, 1);
    rt.draw(g);
    g.destroy();
  }

  private selectChar(
    char: FighterData,
    cx: number, cy: number, w: number, h: number,
    spriteObj?: Phaser.GameObjects.Sprite,
  ): void {
    if (this.selecting) return;
    this.selecting = true;

    GameSettings.playerCharId = char.id;

    if (spriteObj) {
      const baseScale = spriteObj.scaleX;
      this.tweens.add({
        targets: spriteObj,
        scaleX: baseScale * 1.15,
        scaleY: baseScale * 1.15,
        duration: 160,
        yoyo: true,
        ease: 'Back.easeOut',
      });
    } else {
      const flash = this.add.rectangle(cx, cy, w, h, 0xffffff, 0.5).setDepth(10);
      this.tweens.add({ targets: flash, alpha: 0, duration: 350, onComplete: () => flash.destroy() });
    }

    this.time.delayedCall(350, () => {
      this.cameras.main.fadeOut(350, 0, 0, 0, (_: unknown, p: number) => {
        if (p === 1) {
          this.scene.stop(SCENES.UI);
          this.scene.start(SCENES.FIGHT);
          this.scene.launch(SCENES.UI);
        }
      });
    });
  }
}
