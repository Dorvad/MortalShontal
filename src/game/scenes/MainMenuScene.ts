import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super(SCENES.MENU); }

  create(): void {
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.buildBackground();
    this.buildSilhouettes();
    this.buildLightningBolts();
    this.buildLogo();
    this.buildMenu();
    this.buildInsertCoin();
    this.buildCornerChrome();
    this.buildScanlines();

    this.input.keyboard?.addKey('ENTER').on('down', () => this.startGame());
    this.input.keyboard?.addKey('SPACE').on('down', () => this.startGame());
  }

  private buildBackground(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x100812)
      .setDepth(0);

    if (this.textures.exists('menu_night')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu_night')
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setAlpha(0.9)
        .setDepth(1);
    }

    // Top glow (pink) + bottom glow (cyan)
    const g = this.add.graphics().setDepth(2);
    g.fillGradientStyle(0xff2e6e, 0xff2e6e, 0xff2e6e, 0xff2e6e, 0.14, 0.14, 0, 0);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.55);
    const g2 = this.add.graphics().setDepth(2);
    g2.fillGradientStyle(0x36e0ff, 0x36e0ff, 0x36e0ff, 0x36e0ff, 0, 0, 0.12, 0.12);
    g2.fillRect(0, GAME_HEIGHT * 0.6, GAME_WIDTH, GAME_HEIGHT * 0.4);
  }

  private buildSilhouettes(): void {
    // Use splash art as dark silhouettes, falling back to card images
    const SPLASH_RATIO = 1086 / 1448; // 0.75

    const aravaKey = this.textures.exists('splash_arava') ? 'splash_arava' : 'card_arava';
    const tomerKey = this.textures.exists('splash_tomer') ? 'splash_tomer' : 'card_tomer';

    const aravaH = GAME_HEIGHT * 0.62;
    this.add.image(GAME_WIDTH * 0.86, GAME_HEIGHT, aravaKey)
      .setOrigin(0.5, 1)
      .setDisplaySize(aravaH * SPLASH_RATIO, aravaH)
      .setTint(0x050308)
      .setAlpha(0.65)
      .setDepth(3);

    const tomerH = GAME_HEIGHT * 0.64;
    this.add.image(GAME_WIDTH * 0.14, GAME_HEIGHT, tomerKey)
      .setOrigin(0.5, 1)
      .setDisplaySize(tomerH * SPLASH_RATIO, tomerH)
      .setFlipX(true)
      .setTint(0x050308)
      .setAlpha(0.65)
      .setDepth(3);
  }

  private buildLightningBolts(): void {
    const boltL = this.add.graphics().setDepth(4);
    boltL.fillStyle(0x36e0ff, 0.9);
    const lx = GAME_WIDTH * 0.24, ly = GAME_HEIGHT * 0.04;
    boltL.fillTriangle(lx + 10, ly, lx - 8, ly + 44, lx + 14, ly + 44);
    boltL.fillTriangle(lx + 14, ly + 44, lx - 4, ly + 88, lx + 26, ly + 88);

    const boltR = this.add.graphics().setDepth(4);
    boltR.fillStyle(0xffd23f, 0.9);
    const rx = GAME_WIDTH * 0.76, ry = GAME_HEIGHT * 0.06;
    boltR.fillTriangle(rx - 10, ry, rx + 8, ry + 44, rx - 14, ry + 44);
    boltR.fillTriangle(rx - 14, ry + 44, rx + 6, ry + 88, rx - 26, ry + 88);

    this.tweens.add({ targets: boltL, alpha: { from: 0, to: 0.9 }, duration: 80, delay: 400, yoyo: true, hold: 2600, repeat: -1 });
    this.tweens.add({ targets: boltR, alpha: { from: 0, to: 0.9 }, duration: 80, delay: 2200, yoyo: true, hold: 1800, repeat: -1 });
  }

  private buildLogo(): void {
    const targetW = GAME_WIDTH * 0.50;
    const logoY   = GAME_HEIGHT * 0.26;

    const logo = this.add.image(GAME_WIDTH / 2, logoY, 'menu_logo')
      .setOrigin(0.5, 0.5)
      .setDepth(5);

    // Uniform scale from native width — preserves aspect ratio of any logo asset
    const sx = targetW / logo.width;
    const sy = sx;
    logo.setScale(0);

    this.tweens.add({
      targets: logo,
      scaleX: sx,
      scaleY: sy,
      duration: 650,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: logo,
          y: logoY - 7,
          duration: 4200,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        });
      },
    });
  }

  private buildMenu(): void {
    const CX = GAME_WIDTH / 2;
    const btnW = 360, btnH = 50;
    const startY = GAME_HEIGHT * 0.618;
    const spacing = 62;

    const items: { label: string; style: 'primary' | 'secondary' | 'disabled'; action: () => void }[] = [
      { label: 'משחק יחיד',           style: 'primary',   action: () => this.startGame() },
      { label: 'הגדרות',               style: 'secondary', action: () => this.openSettings() },
      { label: 'רב-משתתפים (בקרוב)', style: 'disabled',  action: () => {} },
    ];

    const ruleG = this.add.graphics().setDepth(6);
    ruleG.lineStyle(1, 0xffd23f, 0.28);
    ruleG.lineBetween(GAME_WIDTH * 0.20, startY - 32, GAME_WIDTH * 0.80, startY - 32);

    items.forEach(({ label, style, action }, i) => {
      const y = startY + i * spacing;
      const container = this.add.container(CX, y).setDepth(6);

      const bg = this.add.graphics();
      if (style === 'primary') {
        bg.fillGradientStyle(0xffd23f, 0xffd23f, 0xff8a1e, 0xff8a1e, 1);
        bg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
        bg.fillStyle(0xffffff, 0.35);
        bg.fillRect(-btnW / 2 + 3, -btnH / 2 + 3, btnW - 6, 6);
        bg.fillStyle(0x000000, 0.3);
        bg.fillRect(-btnW / 2 + 3, btnH / 2 - 6, btnW - 6, 3);
      } else if (style === 'secondary') {
        bg.fillGradientStyle(0x3a4a6a, 0x3a4a6a, 0x1a2236, 0x1a2236, 1);
        bg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
        bg.fillStyle(0xffffff, 0.12);
        bg.fillRect(-btnW / 2 + 3, -btnH / 2 + 3, btnW - 6, 4);
      } else {
        bg.fillStyle(0x2a1a2e, 0.8);
        bg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
      }
      bg.lineStyle(3, 0x0a0a0f, 1);
      bg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);
      bg.fillStyle(0x0a0a0f, 1);
      bg.fillRect(-btnW / 2, btnH / 2, btnW, 5);

      const txtColor = style === 'primary' ? '#3a1500' : style === 'disabled' ? '#4a3a55' : '#cfe6ff';
      const txt = this.add.text(0, 1, label, {
        fontFamily: '"Secular One", "Heebo", sans-serif',
        fontSize: style === 'primary' ? '26px' : '22px',
        color: txtColor,
      }).setOrigin(0.5, 0.5);

      container.add([bg, txt]);

      if (style !== 'disabled') {
        const hitArea = new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH + 5);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        container.on('pointerover', () => { container.setY(y - 2); txt.setColor('#ffffff'); });
        container.on('pointerout',  () => { container.setY(y);     txt.setColor(txtColor); });
        container.on('pointerdown', () => action());
      } else {
        container.setAlpha(0.38);
      }
    });
  }

  private buildInsertCoin(): void {
    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.962, '★  הכנס מטבע  ★', {
      fontFamily: '"Secular One", "Heebo", sans-serif',
      fontSize: '16px',
      color: '#36e0ff',
      shadow: { color: '#36e0ff', blur: 10, fill: true },
    }).setOrigin(0.5, 1).setDepth(7);

    this.tweens.add({
      targets: txt,
      alpha: { from: 1, to: 0.05 },
      duration: 1100,
      ease: 'Stepped',
      easeParams: [1],
      yoyo: true,
      repeat: -1,
    });
  }

  private buildCornerChrome(): void {
    this.add.text(16, 10, 'v2.0', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#7a6a8a',
    }).setDepth(7);
    this.add.text(GAME_WIDTH - 16, 10, 'CR 02', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#7a6a8a',
    }).setOrigin(1, 0).setDepth(7);
  }

  private buildScanlines(): void {
    const rt = this.add.renderTexture(0, 0, GAME_WIDTH, GAME_HEIGHT).setDepth(10);
    const g  = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x000000, 0.20);
    for (let y = 0; y < GAME_HEIGHT; y += 3) g.fillRect(0, y, GAME_WIDTH, 1);
    rt.draw(g);
    g.destroy();

    // Vignette
    const canvas = document.createElement('canvas');
    canvas.width  = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 0.25,
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 0.72,
    );
    grad.addColorStop(0,   'rgba(0,0,0,0)');
    grad.addColorStop(1,   'rgba(0,0,0,0.65)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.textures.addCanvas('menu_vignette_v2', canvas);
    this.add.image(0, 0, 'menu_vignette_v2').setOrigin(0, 0).setDepth(11);
  }

  private openSettings(): void {
    if (!this.scene.isActive(SCENES.SETTINGS)) {
      this.scene.launch(SCENES.SETTINGS);
    }
  }

  private startGame(): void {
    this.cameras.main.fadeOut(400, 0, 0, 0, (_cam: unknown, progress: number) => {
      if (progress === 1) this.scene.start(SCENES.SELECT);
    });
  }
}
