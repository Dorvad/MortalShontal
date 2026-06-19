import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { nahoraiData } from '../data/nahorai';
import { aravaData }   from '../data/arava';
import { tomerData }   from '../data/tomer';
import { shontalData } from '../data/shontal';
import { FighterData } from '../fighters/FighterData';
import { GameSettings } from '../GameSettings';

const CHARS: FighterData[] = [nahoraiData, aravaData, tomerData, shontalData];

const STAGES = [
  { id: 'stage_telaviv',  name: 'הרחוב',   bgKey: 'stage_telaviv'  },
  { id: 'stage_campus',   name: 'הקמפוס',  bgKey: 'stage_campus'   },
  { id: 'stage_festival', name: 'הפסטיבל', bgKey: 'stage_festival' },
] as const;

// Splash art keys for the large preview panel
const SPLASH_KEYS: Record<string, string> = {
  nahorai: 'splash_nahorai',
  arava:   'splash_arava',
  tomer:   'splash_tomer',
  shontal: 'splash_shontal',
};

// Splash art aspect ratio: 1086×1448 ≈ 0.75
const SPLASH_RATIO = 1086 / 1448;

// Small card illustrations
const CARD_KEYS: Record<string, string> = {
  nahorai: 'card_nahorai',
  arava:   'card_arava',
  tomer:   'card_tomer',
  shontal: 'card_shontal',
};

const CARD_RATIOS: Record<string, number> = {
  nahorai: 308 / 626,
  arava:    89 / 179,
  tomer:    67 / 176,
  shontal:  384 / 512,
};

const PANEL_W  = 220;
const GRID_X   = 248;
const PANEL_H  = GAME_HEIGHT - 212;
const GRID_H   = GAME_HEIGHT - 212;

export class CharacterSelectScene extends Phaser.Scene {
  private selecting = false;
  private selectedChar: FighterData = aravaData;
  private selectedStageId: string   = GameSettings.stageId;
  private previewContainer!: Phaser.GameObjects.Container;
  private previewName!: Phaser.GameObjects.Text;
  private previewSubtitle!: Phaser.GameObjects.Text;
  private cardHighlightGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private stageHighlights: Map<string, Phaser.GameObjects.Graphics>       = new Map();
  private selectedGlowTween: Phaser.Tweens.Tween | null                   = null;

  constructor() { super(SCENES.SELECT); }

  create(): void {
    this.selecting      = false;
    this.selectedChar   = CHARS.find(c => c.id === GameSettings.playerCharId) ?? CHARS[0];
    this.selectedStageId = GameSettings.stageId;
    this.cardHighlightGraphics.clear();
    this.stageHighlights.clear();
    this.selectedGlowTween = null;

    this.buildBackground();
    this.buildHeader();
    this.buildPreviewPanel();
    this.buildCharGrid();
    this.buildStageSelect();
    this.buildFooter();
    this.buildScanlines();

    this.input.keyboard?.addKey('ESC').on('down', () => {
      if (this.selecting) return;
      this.cameras.main.fadeOut(300, 0, 0, 0, (_: unknown, p: number) => {
        if (p === 1) this.scene.start(SCENES.MENU);
      });
    });

    this.cameras.main.fadeIn(300);
  }

  private buildBackground(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x140b16).setDepth(0);
    if (this.textures.exists('menu_night')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu_night')
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setAlpha(0.35)
        .setDepth(1);
    }
    const g = this.add.graphics().setDepth(1);
    g.fillGradientStyle(0x1a0a1e, 0x1a0a1e, 0x0c0610, 0x0c0610, 0.85, 0.85, 1, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private buildHeader(): void {
    const hdr = this.add.graphics().setDepth(3);
    hdr.fillGradientStyle(0x26122e, 0x26122e, 0x16091b, 0x16091b, 1);
    hdr.fillRect(0, 0, GAME_WIDTH, 52);
    hdr.lineStyle(3, 0x0a0a0f, 1);
    hdr.lineBetween(0, 52, GAME_WIDTH, 52);

    const accent = this.add.graphics().setDepth(4);
    accent.fillStyle(0xffd23f, 1);
    accent.fillRect(18, 14, 10, 24);
    accent.fillStyle(0xff3b6b, 1);
    accent.fillRect(30, 14, 10, 24);

    this.add.text(50, 26, 'בחרו את הלוחם', {
      fontFamily: '"Secular One", "Heebo", sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      shadow: { color: '#b23a5e', blur: 8, fill: false, offsetX: 2, offsetY: 2 },
    }).setOrigin(0, 0.5).setDepth(4);
  }

  private buildPreviewPanel(): void {
    const panelX = 18, panelY = 60, panelW = PANEL_W, panelH = PANEL_H;

    const panelBg = this.add.graphics().setDepth(3);
    panelBg.fillGradientStyle(0x1d1330, 0x1d1330, 0x120a1c, 0x120a1c, 1);
    panelBg.fillRect(panelX, panelY, panelW, panelH);
    panelBg.lineStyle(3, 0x0a0a0f, 1);
    panelBg.strokeRect(panelX, panelY, panelW, panelH);
    panelBg.lineStyle(1, 0xffd23f, 0.3);
    panelBg.strokeRect(panelX + 3, panelY + 3, panelW - 6, panelH - 6);

    const labelBg = this.add.graphics().setDepth(4);
    labelBg.fillStyle(0xffd23f, 0.12);
    labelBg.fillRect(panelX, panelY, panelW, 28);
    this.add.text(panelX + 8, panelY + 14, 'P1', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ffd23f',
    }).setOrigin(0, 0.5).setDepth(5);

    // Glow radial under character image
    const imgAreaH = panelH - 94;
    const glowG = this.add.graphics().setDepth(4);
    glowG.fillGradientStyle(0xffd23f, 0xffd23f, 0xffd23f, 0xffd23f, 0, 0.18, 0, 0);
    glowG.fillRect(panelX, panelY + 28 + imgAreaH * 0.5, panelW, imgAreaH * 0.5);

    // Container for character preview image (re-built on selection)
    this.previewContainer = this.add.container(
      panelX + panelW / 2,
      panelY + 28 + imgAreaH / 2,
    ).setDepth(5);
    this.buildPreviewImage();

    // Info bar at bottom
    const statsY = panelY + panelH - 90;
    const statsBg = this.add.graphics().setDepth(4);
    statsBg.fillStyle(0x0e0716, 1);
    statsBg.fillRect(panelX, statsY, panelW, 90);
    statsBg.lineStyle(1, 0x0a0a0f, 1);
    statsBg.lineBetween(panelX, statsY, panelX + panelW, statsY);

    this.previewName = this.add.text(panelX + 10, statsY + 18, '', {
      fontFamily: '"Secular One", "Heebo", sans-serif',
      fontSize: '20px',
      color: '#ffd23f',
    }).setOrigin(0, 0.5).setDepth(5);

    this.previewSubtitle = this.add.text(panelX + 10, statsY + 42, '', {
      fontFamily: '"Heebo", sans-serif',
      fontSize: '13px',
      color: '#b89a86',
    }).setOrigin(0, 0.5).setDepth(5);

    this.refreshPreview();
  }

  private buildPreviewImage(): void {
    this.previewContainer.removeAll(true);
    const char      = this.selectedChar;
    const splashKey = SPLASH_KEYS[char.id];
    const cardKey   = CARD_KEYS[char.id];

    if (splashKey && this.textures.exists(splashKey)) {
      const panelW   = PANEL_W;
      const imgAreaH = PANEL_H - 90 - 28;
      const h        = Math.min(imgAreaH - 10, panelW / SPLASH_RATIO);
      const img = this.add.image(0, 0, splashKey)
        .setDisplaySize(h * SPLASH_RATIO, h)
        .setOrigin(0.5, 0.5);
      this.previewContainer.add(img);
    } else if (cardKey && this.textures.exists(cardKey)) {
      const ratio = CARD_RATIOS[char.id] ?? 0.5;
      const h     = 150;
      const img = this.add.image(0, 0, cardKey)
        .setDisplaySize(h * ratio, h)
        .setOrigin(0.5, 0.5);
      this.previewContainer.add(img);
    } else {
      this.previewContainer.add(this.add.rectangle(0, 0, 55, 110, char.color));
    }
  }

  private refreshPreview(): void {
    this.previewName.setText(this.selectedChar.displayName);
    this.previewSubtitle.setText(this.selectedChar.subtitle ?? '');
    this.buildPreviewImage();
  }

  private buildCharGrid(): void {
    const gridX = GRID_X;
    const gridY = 60;
    const gridW = GAME_WIDTH - gridX - 18;
    const gridH = GRID_H;
    const cols  = 4;
    const gap   = 10;
    const cardW = (gridW - gap * (cols - 1)) / cols;
    const cardH = gridH;

    CHARS.forEach((char, idx) => {
      const col = idx % cols;
      const x   = gridX + col * (cardW + gap);
      const y   = gridY;
      const cx  = x + cardW / 2;
      const cy  = y + cardH / 2;

      const isSelected = char.id === this.selectedChar.id;

      // Card background
      const cardBg = this.add.graphics().setDepth(3);
      this.drawCardBg(cardBg, x, y, cardW, cardH, char, isSelected);

      // Selection highlight (also used when toggling)
      const hlGfx = this.add.graphics().setDepth(4);
      this.cardHighlightGraphics.set(char.id, hlGfx);
      if (isSelected) {
        this.drawCardHighlight(hlGfx, x, y, cardW, cardH);
        // Start pulsing glow on initial selection
        this.selectedGlowTween = this.tweens.add({
          targets: hlGfx,
          alpha: { from: 0.55, to: 1.0 },
          duration: 550,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        });
      }

      // Character illustration — prefer splash art, fall back to card image
      const splashKey = SPLASH_KEYS[char.id];
      const cardKey   = CARD_KEYS[char.id];
      let spriteObj: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;

      if (splashKey && this.textures.exists(splashKey)) {
        // Clamp height so width never exceeds card bounds (SPLASH_RATIO = w/h = 0.75)
        const imgH = Math.min(cardH * 0.88, (cardW - 8) / SPLASH_RATIO);
        spriteObj = this.add.image(cx, y + cardH - 28, splashKey)
          .setDisplaySize(imgH * SPLASH_RATIO, imgH)
          .setOrigin(0.5, 1)
          .setDepth(5);
      } else if (cardKey && this.textures.exists(cardKey)) {
        const ratio = CARD_RATIOS[char.id] ?? 0.5;
        const imgH  = cardH * 0.70;
        spriteObj = this.add.image(cx, y + cardH - 32, cardKey)
          .setDisplaySize(imgH * ratio, imgH)
          .setOrigin(0.5, 1)
          .setDepth(5);
      } else {
        spriteObj = this.add.rectangle(cx, cy - 20, 50, 100, char.color).setDepth(5);
      }

      // If no splash art, try animated idle sprite
      if (!this.textures.exists(splashKey ?? '')) {
        const idleKey = `${char.spriteKey}_idle`;
        if (char.spriteKey && this.textures.exists(idleKey)) {
          const spr = this.add.sprite(cx, y + cardH - 32, idleKey)
            .setOrigin(0.5, 1).setDepth(6);
          const targetH = 90;
          spr.setScale(targetH / spr.frame.realHeight);
          const animKey = `${char.spriteKey}_idle`;
          const af = char.animFrames?.idle;
          if (af && !this.anims.exists(animKey)) {
            this.anims.create({
              key: animKey,
              frames: af.frames
                ? this.anims.generateFrameNumbers(idleKey, { frames: af.frames })
                : this.anims.generateFrameNumbers(idleKey, { start: af.start, end: af.end }),
              frameRate: af.frameRate,
              repeat: -1,
            });
          }
          if (this.anims.exists(animKey)) spr.play(animKey);
          spriteObj.setVisible(false);
          spriteObj = spr as unknown as Phaser.GameObjects.Image;
        }
      }

      // Character name at bottom
      this.add.text(cx, y + cardH - 10, char.displayName, {
        fontFamily: '"Secular One", "Heebo", sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        shadow: { color: '#000000', blur: 4, fill: true },
      }).setOrigin(0.5, 1).setDepth(7);

      // Hit zone
      const hit = this.add.rectangle(cx, cy, cardW, cardH, 0x000000, 0)
        .setDepth(8)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerover', () => {
        if (this.selecting) return;
        (spriteObj as Phaser.GameObjects.Image).setTint?.(0xffffcc);
      });
      hit.on('pointerout', () => {
        (spriteObj as Phaser.GameObjects.Image).clearTint?.();
      });
      hit.on('pointerdown', () => {
        (spriteObj as Phaser.GameObjects.Image).clearTint?.();
        this.onCharSelect(char, spriteObj as Phaser.GameObjects.Image, x, y, cardW, cardH);
      });
    });
  }

  private buildStageSelect(): void {
    const stripY = GAME_HEIGHT - 152;
    const stripH = 100;
    const stripX = GRID_X;
    const stripW = GAME_WIDTH - GRID_X - 18;

    // Strip background
    const bg = this.add.graphics().setDepth(3);
    bg.fillGradientStyle(0x16091b, 0x16091b, 0x0c0610, 0x0c0610, 1);
    bg.fillRect(stripX, stripY, stripW, stripH);
    bg.lineStyle(1, 0x0a0a0f, 1);
    bg.lineBetween(stripX, stripY, stripX + stripW, stripY);

    // "זירה:" label on left side aligned with strip
    this.add.text(18, stripY + stripH / 2, 'זירה:', {
      fontFamily: '"Secular One", "Heebo", sans-serif',
      fontSize: '14px',
      color: '#7a6f8a',
    }).setOrigin(0, 0.5).setDepth(4);

    const n   = STAGES.length;
    const gap = 10;
    const thumbW = (stripW - gap * (n - 1)) / n;
    const thumbH = stripH - 20; // 10px padding top+bottom
    const thumbY = stripY + 10;

    STAGES.forEach((stage, i) => {
      const thumbX = stripX + i * (thumbW + gap);
      const cx     = thumbX + thumbW / 2;
      const isSelected = stage.id === this.selectedStageId;

      // Thumbnail background (dark fill as fallback)
      const thumbBg = this.add.graphics().setDepth(4);
      thumbBg.fillStyle(0x0e0e1a, 1);
      thumbBg.fillRect(thumbX, thumbY, thumbW, thumbH);

      // Stage background image clipped to thumbnail bounds
      if (this.textures.exists(stage.bgKey)) {
        const img = this.add.image(thumbX, thumbY, stage.bgKey)
          .setOrigin(0, 0)
          .setDepth(5);
        const scale = Math.max(thumbW / img.width, thumbH / img.height);
        img.setScale(scale);

        // Clip using geometry mask
        const maskShape = this.make.graphics({ x: 0, y: 0 });
        maskShape.fillRect(thumbX, thumbY, thumbW, thumbH);
        img.setMask(maskShape.createGeometryMask());

        // Dark overlay — lighter when selected
        const overlay = this.add.graphics().setDepth(6);
        overlay.fillStyle(0x000000, isSelected ? 0.15 : 0.45);
        overlay.fillRect(thumbX, thumbY, thumbW, thumbH);
      }

      // Border highlight — gold when selected, dark otherwise
      const borderGfx = this.add.graphics().setDepth(7);
      this.stageHighlights.set(stage.id, borderGfx);
      this.drawStageBorder(borderGfx, thumbX, thumbY, thumbW, thumbH, isSelected);

      // Stage name
      this.add.text(cx, thumbY + thumbH - 4, stage.name, {
        fontFamily: '"Secular One", "Heebo", sans-serif',
        fontSize: '12px',
        color: '#ffffff',
        shadow: { color: '#000000', blur: 3, fill: true },
      }).setOrigin(0.5, 1).setDepth(8);

      // Hit zone
      const hit = this.add.rectangle(cx, thumbY + thumbH / 2, thumbW, thumbH, 0x000000, 0)
        .setDepth(9).setInteractive({ useHandCursor: true });

      hit.on('pointerdown', () => this.onStageSelect(stage.id));
    });
  }

  private drawStageBorder(
    g: Phaser.GameObjects.Graphics,
    x: number, y: number, w: number, h: number,
    selected: boolean,
  ): void {
    g.clear();
    g.lineStyle(2, selected ? 0xffd23f : 0x0a0a0f, 1);
    g.strokeRect(x, y, w, h);
    if (selected) {
      g.lineStyle(1, 0xffd23f, 0.35);
      g.strokeRect(x + 3, y + 3, w - 6, h - 6);
    }
  }

  private onStageSelect(id: string): void {
    if (this.selecting) return;
    this.selectedStageId = id;

    STAGES.forEach(stage => {
      const gfx = this.stageHighlights.get(stage.id);
      if (!gfx) return;
      // Recalculate thumbnail position
      const n      = STAGES.length;
      const gap    = 10;
      const stripW = GAME_WIDTH - GRID_X - 18;
      const thumbW = (stripW - gap * (n - 1)) / n;
      const thumbH = 80;
      const thumbY = GAME_HEIGHT - 152 + 10;
      const thumbX = GRID_X + STAGES.indexOf(stage) * (thumbW + gap);
      this.drawStageBorder(gfx, thumbX, thumbY, thumbW, thumbH, stage.id === id);
    });

    // Scale pop on selected thumbnail border
    const gfx = this.stageHighlights.get(id);
    if (gfx) {
      this.tweens.add({
        targets: gfx,
        alpha: { from: 0.6, to: 1 },
        duration: 150,
        ease: 'Sine.easeOut',
      });
    }
  }

  private drawCardBg(
    g: Phaser.GameObjects.Graphics,
    x: number, y: number, w: number, h: number,
    char: FighterData, selected: boolean,
  ): void {
    const r = (char.color >> 16) & 0xff;
    const tint = r > 0x80 ? 0x2e1414 : 0x16202e;
    g.fillStyle(tint, 0.9);
    g.fillRect(x, y, w, h);
    // Fighter-color gradient accent at card bottom
    g.fillGradientStyle(char.color, char.color, char.color, char.color, 0, 0, 0.22, 0.22);
    g.fillRect(x, y + h - 80, w, 80);
    g.lineStyle(selected ? 3 : 2, selected ? 0xffd23f : 0x0a0a0f, 1);
    g.strokeRect(x, y, w, h);
  }

  private drawCardHighlight(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
    g.clear();
    g.lineStyle(3, 0xffd23f, 1);
    g.strokeRect(x, y, w, h);
    // Glow lines inside
    g.lineStyle(1, 0xffd23f, 0.25);
    g.strokeRect(x + 4, y + 4, w - 8, h - 8);
  }

  private buildFooter(): void {
    const ftrH = 52;
    const ftrY = GAME_HEIGHT - ftrH;

    const ftr = this.add.graphics().setDepth(3);
    ftr.fillGradientStyle(0x16091b, 0x16091b, 0x0c0610, 0x0c0610, 1);
    ftr.fillRect(0, ftrY, GAME_WIDTH, ftrH);
    ftr.lineStyle(3, 0x0a0a0f, 1);
    ftr.lineBetween(0, ftrY, GAME_WIDTH, ftrY);

    this.add.text(18, ftrY + ftrH / 2, '◀  ESC — חזרה', {
      fontFamily: '"Secular One", "Heebo", sans-serif',
      fontSize: '14px',
      color: '#7a6f8a',
    }).setOrigin(0, 0.5).setDepth(4);

    const btnW = 168, btnH = 38;
    const btnX = GAME_WIDTH - 18 - btnW / 2;
    const btnY = ftrY + ftrH / 2;

    const fightBtnG = this.add.graphics().setDepth(4);
    const fightTxt  = this.add.text(btnX, btnY, '!להילחם', {
      fontFamily: '"Secular One", "Heebo", sans-serif',
      fontSize: '22px',
      color: '#3a1500',
    }).setOrigin(0.5, 0.5).setDepth(5);

    const drawFightBtn = (hover: boolean) => {
      fightBtnG.clear();
      fightBtnG.fillGradientStyle(
        hover ? 0xffe566 : 0xffd23f, hover ? 0xffe566 : 0xffd23f,
        hover ? 0xffa530 : 0xff8a1e, hover ? 0xffa530 : 0xff8a1e, 1);
      fightBtnG.fillRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH);
      fightBtnG.fillStyle(0xffffff, 0.35);
      fightBtnG.fillRect(btnX - btnW / 2 + 3, btnY - btnH / 2 + 3, btnW - 6, 5);
      fightBtnG.lineStyle(3, 0x0a0a0f, 1);
      fightBtnG.strokeRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH);
      fightBtnG.fillStyle(0x0a0a0f, 1);
      fightBtnG.fillRect(btnX - btnW / 2, btnY + btnH / 2, btnW, 4);
    };
    drawFightBtn(false);

    const hit = this.add.rectangle(btnX, btnY, btnW, btnH + 4, 0x000000, 0)
      .setDepth(6).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => { drawFightBtn(true);  fightTxt.setColor('#ffffff'); });
    hit.on('pointerout',  () => { drawFightBtn(false); fightTxt.setColor('#3a1500'); });
    hit.on('pointerdown', () => this.startFight());
  }

  private buildScanlines(): void {
    const rt = this.add.renderTexture(0, 0, GAME_WIDTH, GAME_HEIGHT).setDepth(15);
    const g  = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x000000, 0.20);
    for (let y = 0; y < GAME_HEIGHT; y += 3) g.fillRect(0, y, GAME_WIDTH, 1);
    rt.draw(g);
    g.destroy();
  }

  private onCharSelect(
    char: FighterData,
    spriteObj: Phaser.GameObjects.Image,
    _x: number, _y: number, _w: number, _h: number,
  ): void {
    if (this.selecting) return;

    // Update selection state
    this.selectedChar = char;
    this.refreshPreview();

    // Redraw all card highlight borders
    const cols  = 4;
    const gap   = 10;
    const gridX = GRID_X;
    const gridY = 60;
    const gridW = GAME_WIDTH - gridX - 18;
    const cardW = (gridW - gap * (cols - 1)) / cols;
    const cardH = GRID_H;

    // Stop previous glow tween
    this.selectedGlowTween?.stop();
    this.selectedGlowTween = null;

    CHARS.forEach((c, idx) => {
      const col   = idx % cols;
      const x     = gridX + col * (cardW + gap);
      const y     = gridY;
      const hlGfx = this.cardHighlightGraphics.get(c.id);
      if (hlGfx) {
        hlGfx.setAlpha(1);
        if (c.id === char.id) {
          this.drawCardHighlight(hlGfx, x, y, cardW, cardH);
        } else {
          hlGfx.clear();
        }
      }
    });

    // Start pulsing glow on newly selected card
    const newGlowGfx = this.cardHighlightGraphics.get(char.id);
    if (newGlowGfx) {
      this.selectedGlowTween = this.tweens.add({
        targets: newGlowGfx,
        alpha: { from: 0.55, to: 1.0 },
        duration: 550,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }

    // Scale pop on selected sprite
    const sx = spriteObj.scaleX;
    const sy = spriteObj.scaleY;
    this.tweens.add({
      targets: spriteObj,
      scaleX: sx * 1.1,
      scaleY: sy * 1.1,
      duration: 120,
      yoyo: true,
      ease: 'Back.easeOut',
    });
  }

  private startFight(): void {
    if (this.selecting) return;
    this.selecting = true;

    // Stop glow to avoid leaked tweens
    this.selectedGlowTween?.stop();
    this.selectedGlowTween = null;

    GameSettings.playerCharId = this.selectedChar.id;
    GameSettings.stageId      = this.selectedStageId;

    this.time.delayedCall(200, () => {
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
