import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

const CX = GAME_WIDTH  / 2;
const CY = GAME_HEIGHT / 2;

export class MainMenuScene extends Phaser.Scene {
  constructor() { super(SCENES.MENU); }

  create(): void {
    this.cameras.main.fadeIn(500, 0, 0, 0);

    this.buildBackground();
    this.buildHorizonGlow();
    this.buildCharacters();
    this.buildLogoGlow();
    this.buildLogo();
    this.buildMenu();
    this.buildInsertCoin();
    this.buildCornerChrome();
    this.buildOverlay();

    this.input.keyboard?.addKey('ENTER').on('down', () => this.startGame());
    this.input.keyboard?.addKey('SPACE').on('down', () => this.startGame());
  }

  // ── Layers ────────────────────────────────────────────────────────────────────

  private buildBackground(): void {
    // Base: near-black warm-purple
    this.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0x08030e).setDepth(0);

    // Upper sky — cool purple fade from top
    const sky = this.add.graphics().setDepth(1);
    sky.fillGradientStyle(0x1a073a, 0x1a073a, 0x08030e, 0x08030e, 0.9, 0.9, 0, 0);
    sky.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.55);

    // Lower ambient — warm deep red-brown near bottom
    const ground = this.add.graphics().setDepth(1);
    ground.fillGradientStyle(0x08030e, 0x08030e, 0x1a0a02, 0x1a0a02, 0, 0, 0.7, 0.7);
    ground.fillRect(0, GAME_HEIGHT * 0.5, GAME_WIDTH, GAME_HEIGHT * 0.5);
  }

  private buildHorizonGlow(): void {
    // Wide warm amber spotlight emanating from center-bottom — gives depth
    const canvas = document.createElement('canvas');
    canvas.width  = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    const ctx = canvas.getContext('2d')!;

    const glow = ctx.createRadialGradient(
      CX, GAME_HEIGHT * 0.72, 0,
      CX, GAME_HEIGHT * 0.72, GAME_WIDTH * 0.62,
    );
    glow.addColorStop(0,    'rgba(255,130,20,0.28)');
    glow.addColorStop(0.45, 'rgba(220,80,10,0.12)');
    glow.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.textures.addCanvas('menu_horizon_glow', canvas);
    this.add.image(0, 0, 'menu_horizon_glow').setOrigin(0, 0).setDepth(2);
  }

  private buildCharacters(): void {
    const SPLASH_RATIO = 1086 / 1448; // portrait w/h

    const aravaKey = this.textures.exists('splash_arava') ? 'splash_arava' : 'card_arava';
    const tomerKey = this.textures.exists('splash_tomer') ? 'splash_tomer' : 'card_tomer';

    // Tomer — left side, dark green tint
    const tomerH = GAME_HEIGHT * 0.78;
    const tomerImg = this.add.image(GAME_WIDTH * 0.11, GAME_HEIGHT * 1.02, tomerKey)
      .setOrigin(0.5, 1)
      .setDisplaySize(tomerH * SPLASH_RATIO, tomerH)
      .setFlipX(true)
      .setTint(0x061408)
      .setAlpha(0)
      .setDepth(3);

    // Arava — right side, dark orange tint
    const aravaH = GAME_HEIGHT * 0.75;
    const aravaImg = this.add.image(GAME_WIDTH * 0.89, GAME_HEIGHT * 1.02, aravaKey)
      .setOrigin(0.5, 1)
      .setDisplaySize(aravaH * SPLASH_RATIO, aravaH)
      .setTint(0x180802)
      .setAlpha(0)
      .setDepth(3);

    // Slide up and fade in
    this.tweens.add({ targets: tomerImg, y: GAME_HEIGHT, alpha: 0.60, duration: 800, delay: 200, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: aravaImg, y: GAME_HEIGHT, alpha: 0.55, duration: 800, delay: 350, ease: 'Cubic.easeOut' });

    // Inner-edge color bleed — gives them a colored aura on the inside edge
    const bleedL = this.add.graphics().setDepth(4);
    bleedL.fillGradientStyle(0x1a4010, 0x1a4010, 0x1a4010, 0x1a4010, 0.22, 0, 0.22, 0);
    bleedL.fillRect(0, GAME_HEIGHT * 0.25, GAME_WIDTH * 0.22, GAME_HEIGHT * 0.75);

    const bleedR = this.add.graphics().setDepth(4);
    bleedR.fillGradientStyle(0x3a1808, 0x3a1808, 0x3a1808, 0x3a1808, 0, 0.18, 0, 0.18);
    bleedR.fillRect(GAME_WIDTH * 0.78, GAME_HEIGHT * 0.25, GAME_WIDTH * 0.22, GAME_HEIGHT * 0.75);
  }

  private buildLogoGlow(): void {
    // Warm golden bloom sitting behind the logo
    const canvas = document.createElement('canvas');
    canvas.width  = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    const ctx = canvas.getContext('2d')!;

    const bloom = ctx.createRadialGradient(CX, GAME_HEIGHT * 0.30, 0, CX, GAME_HEIGHT * 0.30, 340);
    bloom.addColorStop(0,    'rgba(255,210,60,0.22)');
    bloom.addColorStop(0.5,  'rgba(255,140,10,0.10)');
    bloom.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.textures.addCanvas('menu_logo_bloom', canvas);
    this.add.image(0, 0, 'menu_logo_bloom').setOrigin(0, 0).setDepth(4);
  }

  private buildLogo(): void {
    const targetW = GAME_WIDTH * 0.56;
    const logoY   = GAME_HEIGHT * 0.27;

    const logo = this.add.image(CX, logoY, 'menu_logo')
      .setOrigin(0.5, 0.5)
      .setDepth(5);

    const sx = targetW / logo.width;
    logo.setScale(0);

    this.tweens.add({
      targets: logo,
      scaleX: sx,
      scaleY: sx,
      duration: 700,
      delay: 100,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: logo,
          y: logoY - 8,
          duration: 3800,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        });
      },
    });
  }

  private buildMenu(): void {
    const btnW = 340, btnH = 56;
    const startY  = GAME_HEIGHT * 0.60;
    const spacing = 68;

    // Separator line between logo and buttons
    const sep = this.add.graphics().setDepth(6);
    sep.lineStyle(1, 0xffd23f, 0.22);
    sep.lineBetween(CX - 140, startY - 36, CX + 140, startY - 36);

    const items: { label: string; style: 'primary' | 'secondary' | 'disabled'; action: () => void }[] = [
      { label: 'משחק יחיד',           style: 'primary',   action: () => this.startGame() },
      { label: 'הגדרות',               style: 'secondary', action: () => this.openSettings() },
      { label: 'רב-משתתפים (בקרוב)', style: 'disabled',  action: () => {} },
    ];

    items.forEach(({ label, style, action }, i) => {
      const y = startY + i * spacing;
      const container = this.add.container(CX, y).setDepth(6);

      const bg       = this.add.graphics();
      const txtColor = style === 'primary' ? '#2a0e00' : style === 'disabled' ? '#3a2a44' : '#c8dcff';

      const draw = (hover: boolean) => {
        bg.clear();
        if (style === 'primary') {
          if (hover) {
            bg.fillGradientStyle(0xffea66, 0xffea66, 0xffaa30, 0xffaa30, 1);
          } else {
            bg.fillGradientStyle(0xffd23f, 0xffd23f, 0xff8a1e, 0xff8a1e, 1);
          }
          bg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
          bg.fillStyle(0xffffff, hover ? 0.45 : 0.30);
          bg.fillRect(-btnW / 2 + 4, -btnH / 2 + 4, btnW - 8, 7);
          bg.lineStyle(2, hover ? 0xffd23f : 0xcc6600, 1);
          bg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);
        } else if (style === 'secondary') {
          bg.fillStyle(hover ? 0x2a3a5a : 0x141c30, hover ? 1 : 0.88);
          bg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
          bg.lineStyle(2, hover ? 0x7090cc : 0x3a4a6a, 1);
          bg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);
        } else {
          bg.fillStyle(0x1a0f22, 0.7);
          bg.fillRect(-btnW / 2, -btnH / 2, btnW, btnH);
          bg.lineStyle(1, 0x2a1a33, 1);
          bg.strokeRect(-btnW / 2, -btnH / 2, btnW, btnH);
        }
      };

      draw(false);

      const txt = this.add.text(0, 1, label, {
        fontFamily: '"Secular One", "Heebo", sans-serif',
        fontSize: style === 'primary' ? '27px' : '22px',
        color: txtColor,
      }).setOrigin(0.5, 0.5);

      container.add([bg, txt]);

      // Animate in
      container.setAlpha(0);
      container.setY(y + 14);
      this.tweens.add({
        targets: container,
        y,
        alpha: style === 'disabled' ? 0.35 : 1,
        duration: 350,
        delay: 400 + i * 80,
        ease: 'Cubic.easeOut',
      });

      if (style !== 'disabled') {
        const hitArea = new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        container.on('pointerover', () => { draw(true);  txt.setColor('#ffffff'); });
        container.on('pointerout',  () => { draw(false); txt.setColor(txtColor); });
        container.on('pointerdown', () => action());
      }
    });
  }

  private buildInsertCoin(): void {
    const txt = this.add.text(CX, GAME_HEIGHT - 14, '✦  הכנס מטבע  ✦', {
      fontFamily: '"Secular One", "Heebo", sans-serif',
      fontSize: '15px',
      color: '#ffd23f',
      shadow: { color: '#ff8a1e', blur: 8, fill: true },
    }).setOrigin(0.5, 1).setDepth(7);

    this.tweens.add({
      targets: txt,
      alpha: { from: 1, to: 0.08 },
      duration: 950,
      ease: 'Stepped',
      easeParams: [1],
      yoyo: true,
      repeat: -1,
    });
  }

  private buildCornerChrome(): void {
    this.add.text(14, 10, 'v2.0', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#5a4a6a',
    }).setDepth(7);
    this.add.text(GAME_WIDTH - 14, 10, 'CR 02', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#5a4a6a',
    }).setOrigin(1, 0).setDepth(7);
  }

  // Scanlines + vignette rendered last
  private buildOverlay(): void {
    // Scanlines — very subtle
    const rt = this.add.renderTexture(0, 0, GAME_WIDTH, GAME_HEIGHT).setDepth(10);
    const g  = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x000000, 0.13);
    for (let y = 0; y < GAME_HEIGHT; y += 3) g.fillRect(0, y, GAME_WIDTH, 1);
    rt.draw(g);
    g.destroy();

    // Vignette — gentle darkening at edges
    const canvas = document.createElement('canvas');
    canvas.width  = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    const ctx = canvas.getContext('2d')!;
    const vig = ctx.createRadialGradient(CX, CY, GAME_WIDTH * 0.20, CX, CY, GAME_WIDTH * 0.70);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.textures.addCanvas('menu_vignette_v3', canvas);
    this.add.image(0, 0, 'menu_vignette_v3').setOrigin(0, 0).setDepth(11);
  }

  // ── Actions ───────────────────────────────────────────────────────────────────

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
