import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { GameSettings } from '../GameSettings';

const CX = GAME_WIDTH  / 2;
const CY = GAME_HEIGHT / 2;
const PW = 560;
const PH = 400;
// Derived: header = 52px, body starts at CY - PH/2 + 52 + 22, row spacing = 52
const BODY_TOP = (ph: number) => CY - ph / 2 + 52 + 22;
const BTN_X    = CX + 90;   // toggle button centre-x
const BTN_W    = 197;
const BTN_H    = 40;

export class SettingsScene extends Phaser.Scene {
  private fromFight  = false;
  private timerBg!:  Phaser.GameObjects.Graphics;
  private timerTxt!: Phaser.GameObjects.Text;
  private aiBg!:     Phaser.GameObjects.Graphics;
  private aiTxt!:    Phaser.GameObjects.Text;

  constructor() { super(SCENES.SETTINGS); }

  init(data?: { fromFight?: boolean }): void {
    this.fromFight = !!data?.fromFight;
  }

  create(): void {
    // Full-screen backdrop
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.82)
      .setOrigin(0, 0).setDepth(0);

    // Panel fill
    const panelBg = this.add.graphics().setDepth(1);
    panelBg.fillGradientStyle(0x1a0a1e, 0x1a0a1e, 0x0c0610, 0x0c0610, 1);
    panelBg.fillRect(CX - PW / 2, CY - PH / 2, PW, PH);
    panelBg.lineStyle(3, 0x0a0a0f, 1);
    panelBg.strokeRect(CX - PW / 2, CY - PH / 2, PW, PH);
    panelBg.lineStyle(1, 0xffd23f, 0.25);
    panelBg.strokeRect(CX - PW / 2 + 3, CY - PH / 2 + 3, PW - 6, PH - 6);

    // Header strip
    const hdrBg = this.add.graphics().setDepth(2);
    hdrBg.fillGradientStyle(0x26122e, 0x26122e, 0x16091b, 0x16091b, 1);
    hdrBg.fillRect(CX - PW / 2, CY - PH / 2, PW, 52);
    hdrBg.lineStyle(3, 0x0a0a0f, 1);
    hdrBg.lineBetween(CX - PW / 2, CY - PH / 2 + 52, CX + PW / 2, CY - PH / 2 + 52);

    this.add.text(CX - PW / 2 + 20, CY - PH / 2 + 26, '⚙', {
      fontSize: '22px', color: '#ffd23f',
    }).setOrigin(0, 0.5).setDepth(3);
    this.add.text(CX - PW / 2 + 52, CY - PH / 2 + 26, 'הגדרות', {
      fontFamily: '"Secular One", "Heebo", sans-serif',
      fontSize: '22px',
      color: '#ffffff',
      shadow: { color: '#b23a5e', blur: 6, fill: false, offsetX: 2, offsetY: 2 },
    }).setOrigin(0, 0.5).setDepth(3);

    const bodyTop = BODY_TOP(PH);

    // ── Row 1: Timer ──────────────────────────────────────────────────────────
    const timerY = bodyTop + 52 * 0;
    this.add.text(CX - PW / 2 + 24, timerY, 'TIMER', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px', color: '#9999bb',
    }).setOrigin(0, 0.5).setDepth(3);

    this.timerBg  = this.add.graphics().setDepth(3);
    this.timerTxt = this.add.text(BTN_X, timerY, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px', color: '#ffffff',
    }).setOrigin(0.5, 0.5).setDepth(4);

    const timerHit = this.add.rectangle(BTN_X, timerY, BTN_W, BTN_H, 0x000000, 0)
      .setDepth(5).setInteractive({ useHandCursor: true });
    timerHit.on('pointerdown', () => { GameSettings.unlimitedTimer = !GameSettings.unlimitedTimer; this.refresh(); });
    timerHit.on('pointerover', () => this.timerBg.setAlpha(0.75));
    timerHit.on('pointerout',  () => this.timerBg.setAlpha(1));

    // ── Row 2: Enemy AI ───────────────────────────────────────────────────────
    const aiY = bodyTop + 52 * 1;
    this.add.text(CX - PW / 2 + 24, aiY, 'ENEMY AI', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px', color: '#9999bb',
    }).setOrigin(0, 0.5).setDepth(3);

    this.aiBg  = this.add.graphics().setDepth(3);
    this.aiTxt = this.add.text(BTN_X, aiY, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px', color: '#ffffff',
    }).setOrigin(0.5, 0.5).setDepth(4);

    const aiHit = this.add.rectangle(BTN_X, aiY, BTN_W, BTN_H, 0x000000, 0)
      .setDepth(5).setInteractive({ useHandCursor: true });
    aiHit.on('pointerdown', () => { GameSettings.enemyAI = !GameSettings.enemyAI; this.refresh(); });
    aiHit.on('pointerover', () => this.aiBg.setAlpha(0.75));
    aiHit.on('pointerout',  () => this.aiBg.setAlpha(1));

    this.refresh();

    // ── Footer ────────────────────────────────────────────────────────────────
    const ftrH = 52;
    const ftrY = CY + PH / 2 - ftrH;
    const ftrBg = this.add.graphics().setDepth(2);
    ftrBg.fillGradientStyle(0x16091b, 0x16091b, 0x0c0610, 0x0c0610, 1);
    ftrBg.fillRect(CX - PW / 2, ftrY, PW, ftrH);
    ftrBg.lineStyle(1, 0x0a0a0f, 1);
    ftrBg.lineBetween(CX - PW / 2, ftrY, CX + PW / 2, ftrY);

    const closeBtnX = this.fromFight ? CX + 88 : CX;
    this.addFooterBtn(closeBtnX, ftrY + ftrH / 2, 148, 36, 'CLOSE', '#ffffff', 0x660000, 0xaa0000, () => this.close());

    if (this.fromFight) {
      this.addFooterBtn(CX - 88, ftrY + ftrH / 2, 148, 36, 'חזרה לבחירה', '#ffaa44', 0x442200, 0x885500, () => this.backToSelect(), '#ffd23f');
    }

    this.input.keyboard?.addKey('ESC').on('down', () => this.close());
  }

  private addFooterBtn(
    x: number, y: number, w: number, h: number,
    label: string,
    textColor: string,
    fill: number, hoverFill: number,
    action: () => void,
    hoverTextColor = '#ffffff',
  ): void {
    const g = this.add.graphics().setDepth(3);
    const isHebrew = /[֐-׿]/.test(label);
    const txt = this.add.text(x, y, label, {
      fontFamily: isHebrew ? '"Secular One", "Heebo", sans-serif' : '"Press Start 2P", monospace',
      fontSize: isHebrew ? '14px' : '11px',
      color: textColor,
    }).setOrigin(0.5, 0.5).setDepth(4);

    const draw = (hover: boolean) => {
      g.clear();
      g.fillStyle(hover ? hoverFill : fill, 1);
      g.fillRect(x - w / 2, y - h / 2, w, h);
      g.lineStyle(2, 0x0a0a0f, 1);
      g.strokeRect(x - w / 2, y - h / 2, w, h);
    };
    draw(false);

    const hit = this.add.rectangle(x, y, w, h, 0x000000, 0).setDepth(5).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => action());
    hit.on('pointerover', () => { draw(true);  txt.setColor(hoverTextColor); });
    hit.on('pointerout',  () => { draw(false); txt.setColor(textColor); });
  }

  private refresh(): void {
    const bodyTop = BODY_TOP(PH);
    const timerY  = bodyTop + 52 * 0;
    const aiY     = bodyTop + 52 * 1;

    this.timerBg.clear();
    this.timerBg.fillStyle(GameSettings.unlimitedTimer ? 0x003322 : 0x332200, 1);
    this.timerBg.fillRect(BTN_X - BTN_W / 2, timerY - BTN_H / 2, BTN_W, BTN_H);
    this.timerBg.lineStyle(2, GameSettings.unlimitedTimer ? 0xffd23f : 0xe8332e, 1);
    this.timerBg.strokeRect(BTN_X - BTN_W / 2, timerY - BTN_H / 2, BTN_W, BTN_H);
    this.timerTxt.setText(GameSettings.unlimitedTimer ? 'UNLIMITED' : '99 SEC')
      .setColor(GameSettings.unlimitedTimer ? '#00ff88' : '#ffaa00');

    this.aiBg.clear();
    this.aiBg.fillStyle(GameSettings.enemyAI ? 0x003322 : 0x220000, 1);
    this.aiBg.fillRect(BTN_X - BTN_W / 2, aiY - BTN_H / 2, BTN_W, BTN_H);
    this.aiBg.lineStyle(2, GameSettings.enemyAI ? 0xffd23f : 0xe8332e, 1);
    this.aiBg.strokeRect(BTN_X - BTN_W / 2, aiY - BTN_H / 2, BTN_W, BTN_H);
    this.aiTxt.setText(GameSettings.enemyAI ? 'ON' : 'OFF')
      .setColor(GameSettings.enemyAI ? '#00ff88' : '#ff4444');
  }

  private close(): void {
    if (this.fromFight) this.scene.resume(SCENES.FIGHT);
    this.scene.stop();
  }

  private backToSelect(): void {
    this.scene.stop(SCENES.UI);
    this.scene.stop(SCENES.FIGHT);
    this.scene.start(SCENES.SELECT);
  }
}
