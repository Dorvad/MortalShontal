import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

// ── Layout constants ────────────────────────────────────────────────────────
const HORIZON_Y   = GAME_HEIGHT * 0.52;   // where grid vanishes
const GRID_SPREAD = GAME_WIDTH  * 0.58;   // half-width of grid at bottom edge

export class MainMenuScene extends Phaser.Scene {
  private hLineGraphics!: Phaser.GameObjects.Graphics;
  private gridOffset   = 0;                // fractional scroll 0→N

  constructor() { super(SCENES.MENU); }

  // ── Assets loaded by PreloadScene ───────────────────────────────────────
  create(): void {
    this.createBackground();
    this.createHorizonGlow();
    this.createStaticGrid();
    this.hLineGraphics = this.add.graphics().setDepth(2);
    this.createFighters();
    this.createLogo();
    this.createHUD();
    this.createMenu();
    this.createPressStart();
    this.createCopyright();
    this.createScanlines();
    this.createVignette();
    this.createCRTFlicker();

    // Keyboard shortcuts
    this.input.keyboard?.addKey('ENTER').on('down', () => this.startGame());
    this.input.keyboard?.addKey('SPACE').on('down', () => this.startGame());
  }

  // ── Background ──────────────────────────────────────────────────────────
  private createBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width  = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    const ctx = canvas.getContext('2d')!;
    // Radial gradient: purple core → near-black edge (matches CSS design)
    const grad = ctx.createRadialGradient(
      GAME_WIDTH / 2, GAME_HEIGHT * -0.05, 0,
      GAME_WIDTH / 2, GAME_HEIGHT / 2,    GAME_WIDTH * 0.75,
    );
    grad.addColorStop(0,    '#241652');
    grad.addColorStop(0.52, '#0d0b1c');
    grad.addColorStop(1,    '#050409');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.textures.addCanvas('menu_bg', canvas);
    this.add.image(0, 0, 'menu_bg').setOrigin(0, 0).setDepth(0);
  }

  // ── Horizon glow (red tint above the grid line) ─────────────────────────
  private createHorizonGlow(): void {
    const g = this.add.graphics().setDepth(1);
    g.fillGradientStyle(0xff3b30, 0xff3b30, 0xff3b30, 0xff3b30, 0.26, 0.26, 0, 0);
    g.fillRect(0, 0, GAME_WIDTH, HORIZON_Y * 1.1);
  }

  // ── Static vertical grid lines (drawn once) ─────────────────────────────
  private createStaticGrid(): void {
    const g = this.add.graphics().setDepth(2);
    g.lineStyle(1.2, 0x00e5ff, 0.38);
    const N_V = 18;
    for (let i = 0; i <= N_V; i++) {
      const t     = i / N_V;
      const destX = (GAME_WIDTH / 2 - GRID_SPREAD) + t * GRID_SPREAD * 2;
      g.beginPath();
      g.moveTo(GAME_WIDTH / 2, HORIZON_Y);
      g.lineTo(destX, GAME_HEIGHT);
      g.strokePath();
    }
    // Soft horizon-fade: overlay a gradient rect that masks the grid's top edge
    const fade = this.add.graphics().setDepth(3);
    const fadeH = 60;
    fade.fillGradientStyle(0x0d0b1c, 0x0d0b1c, 0x0d0b1c, 0x0d0b1c, 1, 1, 0, 0);
    fade.fillRect(0, HORIZON_Y - 4, GAME_WIDTH, fadeH);
  }

  // ── Scrolling horizontal grid lines (updated every frame) ───────────────
  private drawHLines(): void {
    const g  = this.hLineGraphics;
    g.clear();
    g.lineStyle(1.5, 0xff2e97, 0.65);
    const N  = 14;
    const gH = GAME_HEIGHT - HORIZON_Y;

    for (let i = 0; i <= N + 1; i++) {
      // t ∈ [0,1]: 0 = bottom (camera), 1 = horizon
      const t = ((i + this.gridOffset) % (N + 1)) / N;
      if (t < 0 || t > 1) continue;
      // Quadratic maps t→y: dense near horizon (t≈1), sparse near camera (t≈0)
      const y = GAME_HEIGHT - gH * (t * t);
      if (y < HORIZON_Y || y > GAME_HEIGHT) continue;
      const spread = (y - HORIZON_Y) / gH;
      const xL = GAME_WIDTH / 2 - spread * GRID_SPREAD;
      const xR = GAME_WIDTH / 2 + spread * GRID_SPREAD;
      g.beginPath();
      g.moveTo(xL, y);
      g.lineTo(xR, y);
      g.strokePath();
    }
  }

  // ── Fighter characters ───────────────────────────────────────────────────
  private createFighters(): void {
    const blondeH = GAME_HEIGHT * 0.86;
    const blonde  = this.add.image(0, GAME_HEIGHT, 'menu_blonde')
      .setOrigin(0, 1)
      .setDepth(4)
      .setDisplaySize(
        Math.round(blondeH * (542 / 1359)),
        Math.round(blondeH),
      );

    const gothH = GAME_HEIGHT * 0.88;
    const goth  = this.add.image(GAME_WIDTH, GAME_HEIGHT, 'menu_goth')
      .setOrigin(1, 1)
      .setDepth(4)
      .setFlipX(true)
      .setDisplaySize(
        Math.round(gothH * (518 / 1398)),
        Math.round(gothH),
      );


    // Bob tweens — each character floats up/down independently
    this.tweens.add({
      targets: blonde, y: GAME_HEIGHT - 6, duration: 2600,
      ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });
    this.tweens.add({
      targets: goth, y: GAME_HEIGHT - 8, duration: 3000,
      ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });
  }

  // ── Logo ────────────────────────────────────────────────────────────────
  private createLogo(): void {
    const logoW = GAME_WIDTH * 0.41;
    const logo  = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT * 0.05, 'menu_logo')
      .setOrigin(0.5, 0)
      .setDepth(5)
      .setDisplaySize(logoW, logoW * (1086 / 1448));

    // Glow-pulse: gentle alpha oscillation standing in for CSS drop-shadow animation
    this.tweens.add({
      targets: logo, alpha: { from: 0.92, to: 1 }, duration: 2400,
      ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });
  }

  // ── Arcade HUD (1UP / HI-SCORE / CREDIT) ────────────────────────────────
  private createHUD(): void {
    const style = (color: string) => ({
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color,
      lineSpacing: 6,
    });
    this.add.text(34,  18, '1UP\n000000',   { ...style('#ff3b30'), align: 'left'   }).setDepth(6);
    this.add.text(480, 18, 'HI-SCORE\n999990', { ...style('#ffd23f'), align: 'center' }).setOrigin(0.5, 0).setDepth(6);
    this.add.text(926, 18, 'CREDIT\n00',    { ...style('#34e1eb'), align: 'right'  }).setOrigin(1, 0).setDepth(6);
  }

  // ── Main menu ────────────────────────────────────────────────────────────
  private createMenu(): void {
    const CX = GAME_WIDTH / 2;
    const menuItems: { label: string; y: number; action: () => void; primary?: boolean }[] = [
      { label: 'התחל משחק',  y: 310, action: () => this.startGame(), primary: true },
      { label: 'שני שחקנים', y: 348, action: () => { /* TODO */ } },
      { label: 'הגדרות',     y: 382, action: () => this.openSettings() },
    ];

    menuItems.forEach(({ label, y, action, primary }) => {
      const fontSize = primary ? '28px' : '23px';
      const baseColor = primary ? '#ffd23f' : '#cfd0e8';
      const hoverColor = primary ? '#ffffff' : '#34e1eb';

      const txt = this.add.text(CX, y, label, {
        fontFamily: '"Secular One", "Heebo", sans-serif',
        fontSize,
        color: baseColor,
        stroke: primary ? '#7a3b00' : undefined,
        strokeThickness: primary ? 3 : 0,
      })
        .setOrigin(0.5, 0.5)
        .setDepth(6)
        .setInteractive({ useHandCursor: true });

      if (primary) {
        // Blinking arrow selector
        const arrow = this.add.text(CX - txt.width / 2 - 24, y, '◄', {
          fontFamily: '"Secular One", sans-serif',
          fontSize: '22px',
          color: '#ff3b30',
        }).setOrigin(0.5, 0.5).setDepth(6);

        this.tweens.add({
          targets: arrow, alpha: { from: 1, to: 0.1 }, duration: 1000,
          ease: 'Stepped', easeParams: [1], yoyo: true, repeat: -1,
        });
      }

      txt
        .on('pointerover',  () => { txt.setColor(hoverColor); txt.setScale(1.06); })
        .on('pointerout',   () => { txt.setColor(baseColor);  txt.setScale(1);    })
        .on('pointerdown',  () => action());
    });
  }

  // ── Press START text ─────────────────────────────────────────────────────
  private createPressStart(): void {
    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.855, 'לחצו ENTER', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#ffffff',
      shadow: { color: '#ff3b30', blur: 14, fill: true },
    }).setOrigin(0.5, 0.5).setDepth(6);

    this.tweens.add({
      targets: txt, alpha: { from: 1, to: 0.08 }, duration: 1100,
      ease: 'Stepped', easeParams: [1], yoyo: true, repeat: -1,
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.89, 'הכנס אסימון  ·  INSERT COIN', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#34e1eb',
      letterSpacing: 1,
    }).setOrigin(0.5, 0.5).setDepth(6);
  }

  // ── Copyright footer ─────────────────────────────────────────────────────
  private createCopyright(): void {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.965, '© 1991 SHONTAL GAMES CORP.', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: 'rgba(255,255,255,0.4)',
    }).setOrigin(0.5, 0.5).setDepth(6).setAlpha(0.4);
  }

  // ── CRT scanlines (one-time RenderTexture) ───────────────────────────────
  private createScanlines(): void {
    const rt = this.add.renderTexture(0, 0, GAME_WIDTH, GAME_HEIGHT).setDepth(8);
    const g  = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x000000, 0.32);
    for (let y = 0; y < GAME_HEIGHT; y += 3) {
      g.fillRect(0, y, GAME_WIDTH, 1);
    }
    rt.draw(g);
    g.destroy();
  }

  // ── Vignette (dark corner gradient) ─────────────────────────────────────
  private createVignette(): void {
    const canvas = document.createElement('canvas');
    canvas.width  = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 0.29,
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 0.75,
    );
    grad.addColorStop(0,   'rgba(0,0,0,0)');
    grad.addColorStop(1,   'rgba(0,0,0,0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.textures.addCanvas('menu_vignette', canvas);
    this.add.image(0, 0, 'menu_vignette').setOrigin(0, 0).setDepth(9);
  }

  // ── CRT flicker (blue overlay, slight alpha oscillation) ─────────────────
  private createCRTFlicker(): void {
    const flicker = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x7ad6ff)
      .setOrigin(0, 0)
      .setDepth(10)
      .setBlendMode(Phaser.BlendModes.OVERLAY)
      .setAlpha(0.10);
    this.tweens.add({
      targets: flicker,
      alpha: { from: 0.10, to: 0.16 },
      duration: 3500,
      ease: 'Stepped',
      easeParams: [2],
      yoyo: true,
      repeat: -1,
    });
  }

  // ── Per-frame update: scroll horizontal grid lines ───────────────────────
  update(_time: number, delta: number): void {
    this.gridOffset += delta * 0.009; // speed: ~9 grid-units per second
    this.drawHLines();
  }

  // ── Settings overlay ─────────────────────────────────────────────────────
  private openSettings(): void {
    if (!this.scene.isActive(SCENES.SETTINGS)) {
      this.scene.launch(SCENES.SETTINGS);
    }
  }

  // ── Transition to character select ───────────────────────────────────────
  private startGame(): void {
    this.cameras.main.fadeOut(400, 0, 0, 0, (_cam: unknown, progress: number) => {
      if (progress === 1) this.scene.start(SCENES.SELECT);
    });
  }
}
