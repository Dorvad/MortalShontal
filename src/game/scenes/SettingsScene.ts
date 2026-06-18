import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { GameSettings } from '../GameSettings';

const CX = GAME_WIDTH  / 2;
const CY = GAME_HEIGHT / 2;
const PW = 420;
const PH = 300;

const LABEL_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: '"Press Start 2P", monospace',
  fontSize:   '12px',
  color:      '#9999bb',
};

const TOGGLE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: '"Press Start 2P", monospace',
  fontSize:   '11px',
  color:      '#ffffff',
};

export class SettingsScene extends Phaser.Scene {
  private fromFight  = false;
  private timerBg!:  Phaser.GameObjects.Rectangle;
  private timerTxt!: Phaser.GameObjects.Text;
  private aiBg!:     Phaser.GameObjects.Rectangle;
  private aiTxt!:    Phaser.GameObjects.Text;

  constructor() { super(SCENES.SETTINGS); }

  init(data?: { fromFight?: boolean }): void {
    this.fromFight = !!data?.fromFight;
  }

  create(): void {
    // ── Full-screen backdrop ────────────────────────────────────────────────
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.80)
      .setOrigin(0, 0).setDepth(0);

    // ── Panel fill ──────────────────────────────────────────────────────────
    this.add.rectangle(CX, CY, PW, PH, 0x0d0b28).setOrigin(0.5).setDepth(1);

    // ── Panel border (drawn with Graphics) ──────────────────────────────────
    const g = this.add.graphics().setDepth(1);
    g.lineStyle(2, 0x4455cc, 1);
    g.strokeRect(CX - PW / 2, CY - PH / 2, PW, PH);

    // ── Title ────────────────────────────────────────────────────────────────
    this.add.text(CX, CY - PH / 2 + 28, 'SETTINGS', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2);

    // ── Divider ──────────────────────────────────────────────────────────────
    const g2 = this.add.graphics().setDepth(2);
    g2.lineStyle(1, 0x334488, 0.9);
    g2.lineBetween(CX - PW / 2 + 20, CY - 62, CX + PW / 2 - 20, CY - 62);

    // ── Row 1: Timer ─────────────────────────────────────────────────────────
    this.add.text(CX - PW / 2 + 24, CY - 32, 'TIMER', LABEL_STYLE)
      .setOrigin(0, 0.5).setDepth(2);

    this.timerBg = this.add.rectangle(CX + 80, CY - 32, 148, 32, 0x332200)
      .setOrigin(0.5).setDepth(2)
      .setInteractive({ useHandCursor: true });
    this.timerTxt = this.add.text(CX + 80, CY - 32, '', TOGGLE_STYLE)
      .setOrigin(0.5).setDepth(3);

    this.timerBg
      .on('pointerdown', () => { GameSettings.unlimitedTimer = !GameSettings.unlimitedTimer; this.refresh(); })
      .on('pointerover', () => this.timerBg.setAlpha(0.75))
      .on('pointerout',  () => this.timerBg.setAlpha(1));

    // ── Row 2: Enemy AI ──────────────────────────────────────────────────────
    this.add.text(CX - PW / 2 + 24, CY + 26, 'ENEMY AI', LABEL_STYLE)
      .setOrigin(0, 0.5).setDepth(2);

    this.aiBg = this.add.rectangle(CX + 80, CY + 26, 148, 32, 0x003322)
      .setOrigin(0.5).setDepth(2)
      .setInteractive({ useHandCursor: true });
    this.aiTxt = this.add.text(CX + 80, CY + 26, '', TOGGLE_STYLE)
      .setOrigin(0.5).setDepth(3);

    this.aiBg
      .on('pointerdown', () => { GameSettings.enemyAI = !GameSettings.enemyAI; this.refresh(); })
      .on('pointerover', () => this.aiBg.setAlpha(0.75))
      .on('pointerout',  () => this.aiBg.setAlpha(1));

    this.refresh();

    // ── Close button ─────────────────────────────────────────────────────────
    const closeBg = this.add.rectangle(CX, CY + PH / 2 - 68, 148, 34, 0x333366)
      .setOrigin(0.5).setDepth(2)
      .setInteractive({ useHandCursor: true });
    const closeTxt = this.add.text(CX, CY + PH / 2 - 68, 'CLOSE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(3);

    closeBg
      .on('pointerdown', () => this.close())
      .on('pointerover', () => { closeBg.setFillStyle(0x5555aa); closeTxt.setColor('#ffd23f'); })
      .on('pointerout',  () => { closeBg.setFillStyle(0x333366); closeTxt.setColor('#ffffff'); });

    // ── Back to Character Select (only shown mid-fight) ───────────────────────
    if (this.fromFight) {
      const backBg = this.add.rectangle(CX, CY + PH / 2 - 26, 220, 34, 0x442200)
        .setOrigin(0.5).setDepth(2)
        .setInteractive({ useHandCursor: true });
      const backTxt = this.add.text(CX, CY + PH / 2 - 26, 'חזרה לבחירה', {
        fontFamily: '"Secular One", "Heebo", sans-serif',
        fontSize: '14px',
        color: '#ffaa44',
      }).setOrigin(0.5).setDepth(3);

      backBg
        .on('pointerdown', () => this.backToSelect())
        .on('pointerover', () => { backBg.setFillStyle(0x885500); backTxt.setColor('#ffd23f'); })
        .on('pointerout',  () => { backBg.setFillStyle(0x442200); backTxt.setColor('#ffaa44'); });
    }

    this.input.keyboard?.addKey('ESC').on('down', () => this.close());
  }

  private refresh(): void {
    if (GameSettings.unlimitedTimer) {
      this.timerBg.setFillStyle(0x003322);
      this.timerTxt.setText('UNLIMITED').setColor('#00ff88');
    } else {
      this.timerBg.setFillStyle(0x332200);
      this.timerTxt.setText('99 SEC').setColor('#ffaa00');
    }

    if (GameSettings.enemyAI) {
      this.aiBg.setFillStyle(0x003322);
      this.aiTxt.setText('ON').setColor('#00ff88');
    } else {
      this.aiBg.setFillStyle(0x220000);
      this.aiTxt.setText('OFF').setColor('#ff4444');
    }
  }

  private close(): void {
    if (this.fromFight) this.scene.resume(SCENES.FIGHT);
    this.scene.stop();
  }

  private backToSelect(): void {
    // Stop fight-related scenes explicitly, then start SELECT which also stops
    // this (Settings) scene.  Avoid calling scene.stop() before scene.start()
    // as that double-queues the stop and can confuse Phaser's scene manager.
    this.scene.stop(SCENES.UI);
    this.scene.stop(SCENES.FIGHT);
    this.scene.start(SCENES.SELECT);
  }
}
