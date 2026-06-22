import Phaser from 'phaser';
import { HealthBar } from '../ui/HealthBar';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { nahoraiData } from '../data/nahorai';
import { aravaData }   from '../data/arava';
import { tomerData }   from '../data/tomer';
import { shontalData } from '../data/shontal';
import { GameSettings } from '../GameSettings';
import { FighterData }  from '../fighters/FighterData';

const BAR_W  = 420;
const BAR_H  = 26;
const BAR_Y  = 14;
const MARGIN = 20;
const AVATAR = 44;

export class UIScene extends Phaser.Scene {
  private playerBar!: HealthBar;
  private enemyBar!:  HealthBar;

  private playerData!: FighterData;
  private enemyData!:  FighterData;

  private roundText!:   Phaser.GameObjects.Text;
  private koText!:      Phaser.GameObjects.Text;
  private restartText!: Phaser.GameObjects.Text;
  private comboText!:   Phaser.GameObjects.Text;
  private comboCount!:  Phaser.GameObjects.Text;

  private fightScene!: Phaser.Scene;

  private showingBanner  = false;
  private lastTimerValue: number | null = null;

  private criticalVignette?: Phaser.GameObjects.Graphics;
  private criticalVignetteTween?: Phaser.Tweens.Tween;
  private criticalActive = false;

  constructor() { super({ key: SCENES.UI, active: false }); }

  create(): void {
    const roster: Record<string, FighterData> = {
      nahorai: nahoraiData, arava: aravaData, tomer: tomerData, shontal: shontalData,
    };
    this.playerData = roster[GameSettings.playerCharId] ?? nahoraiData;
    this.enemyData  = Object.values(roster).find(d => d.id !== this.playerData.id) ?? aravaData;

    // ── Player HUD (left side) ────────────────────────────────────────────────
    const playerBarX = MARGIN + AVATAR + 6;
    this.buildAvatar(MARGIN, BAR_Y, AVATAR, this.playerData, false);
    this.add.text(playerBarX, BAR_Y - 1, this.playerData.displayName, {
      fontFamily: '"Secular One", "Heebo", sans-serif',
      fontSize: '16px', color: '#cfe6ff',
      shadow: { color: '#000000', blur: 4, fill: true },
    }).setScrollFactor(0).setDepth(32);
    this.playerBar = new HealthBar(this, playerBarX, BAR_Y + 18, BAR_W, BAR_H, this.playerData.maxHealth, this.playerData.color, false);

    // ── Enemy HUD (right side) ────────────────────────────────────────────────
    const enemyBarX = GAME_WIDTH - MARGIN - AVATAR - 6;
    this.buildAvatar(GAME_WIDTH - MARGIN - AVATAR, BAR_Y, AVATAR, this.enemyData, true);
    this.add.text(enemyBarX, BAR_Y - 1, this.enemyData.displayName, {
      fontFamily: '"Secular One", "Heebo", sans-serif',
      fontSize: '16px', color: '#ffcece',
      shadow: { color: '#000000', blur: 4, fill: true },
    }).setScrollFactor(0).setDepth(32).setOrigin(1, 0);
    this.enemyBar = new HealthBar(this, enemyBarX, BAR_Y + 18, BAR_W, BAR_H, this.enemyData.maxHealth, this.enemyData.color, true);

    // ── Centre timer ──────────────────────────────────────────────────────────
    this.roundText = this.add.text(GAME_WIDTH / 2, BAR_Y + BAR_H / 2 + 6, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '32px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4,
      shadow: { color: 'rgba(255,210,63,.7)', blur: 10, fill: true },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(35).setVisible(false);

    // ── KO / FIGHT banner ─────────────────────────────────────────────────────
    this.koText = this.add.text(GAME_WIDTH / 2, 290, '', {
      fontFamily: '"Secular One", "Heebo", sans-serif',
      fontSize: '88px', color: '#ffd23f',
      stroke: '#0a0a0f', strokeThickness: 6,
      shadow: { color: '#e8332e', blur: 0, fill: false, offsetX: 5, offsetY: 5 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(36).setVisible(false);

    this.restartText = this.add.text(GAME_WIDTH / 2, 400, 'לחצו להמשך', {
      fontFamily: '"Secular One", "Heebo", sans-serif',
      fontSize: '26px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(36).setVisible(false);

    // ── Combo counter (rotated, arcade-style) ─────────────────────────────────
    this.comboCount = this.add.text(MARGIN + AVATAR + 6, BAR_Y + 18 + BAR_H + 38, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '30px', color: '#ffffff',
      stroke: '#e8332e', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(35).setVisible(false).setAngle(-4);

    this.comboText = this.add.text(MARGIN + AVATAR + 6, BAR_Y + 18 + BAR_H + 74, '', {
      fontFamily: '"Secular One", "Heebo", sans-serif',
      fontSize: '18px', color: '#ffd23f',
      stroke: '#000000', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(35).setVisible(false).setAngle(-4);

    // ── Fullscreen toggle ─────────────────────────────────────────────────────
    const fsBtn = this.add.text(GAME_WIDTH - 10, 8, '⛶', {
      fontSize: '22px', color: '#ffffffaa',
    })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(40).setAlpha(0.55)
      .setInteractive(new Phaser.Geom.Rectangle(-30, -8, 58, 44), Phaser.Geom.Rectangle.Contains)
      .on('pointerdown', () => this.scale.toggleFullscreen())
      .on('pointerover', () => fsBtn.setAlpha(1))
      .on('pointerout',  () => fsBtn.setAlpha(0.55));
    this.input.keyboard?.addKey('F').on('down', () => this.scale.toggleFullscreen());

    // ── Settings button ───────────────────────────────────────────────────────
    const settingsBtn = this.add.text(GAME_WIDTH - 42, 8, '⚙', {
      fontSize: '20px', color: '#ffffffaa',
    })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(40).setAlpha(0.55)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.openSettings())
      .on('pointerover', () => settingsBtn.setAlpha(1))
      .on('pointerout',  () => settingsBtn.setAlpha(0.55));
    this.input.keyboard?.addKey('ESC').on('down', () => this.openSettings());

    this.buildCriticalVignette();

    // ── FightScene event bridge ───────────────────────────────────────────────
    this.fightScene = this.scene.get(SCENES.FIGHT);
    this.fightScene.events.on('roundStart', () => this.showFight());
    this.fightScene.events.on('healthUpdate', (data: { playerHP: number; enemyHP: number }) => {
      this.playerBar.setValue(data.playerHP);
      this.enemyBar.setValue(data.enemyHP);
      const pct = data.playerHP / this.playerData.maxHealth;
      this.setCriticalVignette(pct <= 0.25 && data.playerHP > 0);
    });
    this.fightScene.events.on('timerUpdate', (secs: number | null) => {
      this.lastTimerValue = secs;
      if (!this.showingBanner) this.applyTimerDisplay();
    });
    this.fightScene.events.on('ko', (data: { playerWon: boolean; isTimeout: boolean }) => {
      this.showKO(data.playerWon, data.isTimeout);
    });
    this.fightScene.events.on('comboUpdate', (count: number) => {
      this.showCombo(count);
    });
  }

  private buildAvatar(x: number, y: number, size: number, data: FighterData, flipX: boolean): void {
    const g = this.add.graphics().setScrollFactor(0).setDepth(31);

    // Background tinted to fighter color
    const r   = (data.color >> 16) & 0xff;
    const bgC = r > 0x80 ? 0x2e1414 : 0x16202e;
    g.fillStyle(bgC, 1);
    g.fillRect(x, y, size, size);

    // Portrait or fallback
    const portraitKey = `portrait_${data.id}`;
    const idleKey     = data.spriteKey ? `${data.spriteKey}_idle` : '';

    if (this.textures.exists(portraitKey)) {
      // Portrait: 1254×1254 square — show top-center crop to frame the face.
      // cropFactor=0.46 means the top 46% of the image (face + shoulders) fills
      // the full box height; the center strip fills the width.
      const frame     = this.textures.get(portraitKey).get() as Phaser.Textures.Frame;
      const cropFactor = 0.46;
      const scale     = size / (frame.realHeight * cropFactor);
      const img = this.add.image(x + size / 2, y, portraitKey)
        .setOrigin(0.5, 0)
        .setScale(scale)
        .setFlipX(flipX)
        .setScrollFactor(0).setDepth(32);
      const mask = this.make.graphics({ x: 0, y: 0 });
      mask.fillRect(x, y, size, size);
      img.setMask(mask.createGeometryMask());
    } else if (idleKey && this.textures.exists(idleKey)) {
      // Fallback: scaled idle sprite
      const spr = this.add.sprite(x + size / 2, y + size, idleKey)
        .setOrigin(0.5, 1).setScrollFactor(0).setDepth(32).setFlipX(flipX);
      const targetH = data.spriteDisplayHeight ?? 100;
      spr.setScale((size + 10) / targetH);
      const mask = this.make.graphics({ x: 0, y: 0 });
      mask.fillRect(x, y, size, size);
      spr.setMask(mask.createGeometryMask());
    } else {
      g.fillStyle(data.color, 0.6);
      g.fillRect(x + 6, y + 6, size - 12, size - 12);
    }

    // Border drawn on top
    g.lineStyle(2, 0x0a0a0f, 1);
    g.strokeRect(x, y, size, size);
    // Subtle inner gold accent line
    g.lineStyle(1, data.color, 0.35);
    g.strokeRect(x + 2, y + 2, size - 4, size - 4);
  }

  update(_time: number, delta: number): void {
    this.playerBar.update(delta);
    this.enemyBar.update(delta);
  }

  private showFight(): void {
    this.showingBanner = true;
    this.koText
      .setStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: '52px' })
      .setText('FIGHT!').setColor('#ff3b30').setVisible(true)
      .setScale(0.4);
    this.tweens.add({
      targets: this.koText,
      scaleX: 1, scaleY: 1,
      duration: 260,
      ease: 'Back.easeOut',
    });
    this.time.delayedCall(1300, () => {
      this.koText.setVisible(false);
      this.showingBanner = false;
      this.applyTimerDisplay();
    });
  }

  private applyTimerDisplay(): void {
    const secs = this.lastTimerValue;
    if (secs === null) {
      this.roundText.setVisible(false);
    } else {
      this.roundText.setText(String(secs))
        .setColor(secs <= 10 ? '#ff3b30' : '#ffffff')
        .setVisible(true);
    }
  }

  private showKO(playerWon: boolean, isTimeout: boolean): void {
    this.showingBanner = true;
    this.setCriticalVignette(false);

    if (isTimeout) {
      this.koText.setStyle({ fontFamily: '"Press Start 2P", monospace', fontSize: '52px' })
        .setText('TIME!').setColor('#ff9900').setVisible(true).setScale(1.6);
    } else {
      this.koText.setStyle({ fontFamily: '"Secular One", "Heebo", sans-serif', fontSize: '88px' })
        .setText(playerWon ? 'ניצחון!' : 'הפסדת!').setColor('#ffd23f').setVisible(true).setScale(1.6);
    }
    this.tweens.add({
      targets: this.koText,
      scaleX: 1, scaleY: 1,
      duration: 320,
      ease: 'Back.easeOut',
    });

    this.roundText
      .setText(playerWon ? 'YOU WIN!' : 'YOU LOSE!')
      .setColor(playerWon ? '#00ff88' : '#ff4444').setVisible(true);
    this.restartText.setVisible(true);

    this.time.delayedCall(400, () => {
      this.input.once('pointerdown', () => this.doRestart());
      this.input.keyboard?.once('keydown-SPACE', () => this.doRestart());
      this.input.keyboard?.once('keydown-ENTER', () => this.doRestart());
    });
  }

  private showCombo(count: number): void {
    if (count < 2) {
      this.comboCount.setVisible(false);
      this.comboText.setVisible(false);
      return;
    }
    this.comboCount.setText(String(count)).setVisible(true);
    this.comboText.setText('קומבו!').setVisible(true);
    this.tweens.add({
      targets: [this.comboCount, this.comboText],
      scaleX: 1.3, scaleY: 1.3,
      duration: 80, yoyo: true,
      ease: 'Back.easeOut',
    });
  }

  private openSettings(): void {
    if (this.scene.isActive(SCENES.SETTINGS)) return;
    this.scene.pause(SCENES.FIGHT);
    this.scene.launch(SCENES.SETTINGS, { fromFight: true });
  }

  private doRestart(): void {
    this.koText.setVisible(false);
    this.roundText.setVisible(false);
    this.restartText.setVisible(false);
    this.comboCount.setVisible(false);
    this.comboText.setVisible(false);
    this.showingBanner  = false;
    this.lastTimerValue = null;
    this.setCriticalVignette(false);

    this.playerBar.setValue(this.playerData.maxHealth);
    this.enemyBar.setValue(this.enemyData.maxHealth);

    (this.scene.get(SCENES.FIGHT) as unknown as { restart: () => void }).restart();
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  private buildCriticalVignette(): void {
    const g   = this.add.graphics().setScrollFactor(0).setDepth(30).setAlpha(0);
    const col = 0xff1111;
    const ew  = 110; // edge band width
    // Four gradient edges — each fades from red at the border to transparent inward
    g.fillGradientStyle(col, col, col, col, 0.38, 0, 0.38, 0);
    g.fillRect(0, 0, ew, GAME_HEIGHT);
    g.fillGradientStyle(col, col, col, col, 0, 0.38, 0, 0.38);
    g.fillRect(GAME_WIDTH - ew, 0, ew, GAME_HEIGHT);
    g.fillGradientStyle(col, col, col, col, 0.38, 0.38, 0, 0);
    g.fillRect(0, 0, GAME_WIDTH, ew);
    g.fillGradientStyle(col, col, col, col, 0, 0, 0.38, 0.38);
    g.fillRect(0, GAME_HEIGHT - ew, GAME_WIDTH, ew);
    this.criticalVignette = g;
  }

  private setCriticalVignette(active: boolean): void {
    if (!this.criticalVignette || active === this.criticalActive) return;
    this.criticalActive = active;
    this.criticalVignetteTween?.stop();
    if (active) {
      this.criticalVignetteTween = this.tweens.add({
        targets: this.criticalVignette,
        alpha: { from: 0.5, to: 1.0 },
        duration: 650,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    } else {
      this.criticalVignetteTween = this.tweens.add({
        targets: this.criticalVignette,
        alpha: 0,
        duration: 300,
        ease: 'Quad.easeOut',
      });
    }
  }
}
