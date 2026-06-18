import Phaser from 'phaser';
import { HealthBar } from '../ui/HealthBar';
import { SCENES, GAME_WIDTH } from '../utils/constants';
import { nahoraiData } from '../data/nahorai';
import { aravaData }   from '../data/arava';
import { tomerData }   from '../data/tomer';
import { GameSettings } from '../GameSettings';
import { FighterData }  from '../fighters/FighterData';

const BAR_W  = 430;
const BAR_H  = 28;
const BAR_Y  = 32;
const MARGIN = 28;

export class UIScene extends Phaser.Scene {
  private playerBar!: HealthBar;
  private enemyBar!:  HealthBar;

  private playerData!: FighterData;
  private enemyData!:  FighterData;

  private roundText!:   Phaser.GameObjects.Text;
  private koText!:      Phaser.GameObjects.Text;
  private restartText!: Phaser.GameObjects.Text;
  private comboText!:   Phaser.GameObjects.Text;

  private fightScene!: Phaser.Scene;

  private showingBanner  = false;
  private lastTimerValue: number | null = null;

  constructor() { super({ key: SCENES.UI, active: false }); }

  create(): void {
    const roster: Record<string, FighterData> = {
      nahorai: nahoraiData, arava: aravaData, tomer: tomerData,
    };
    this.playerData = roster[GameSettings.playerCharId] ?? nahoraiData;
    this.enemyData  = Object.values(roster).find(d => d.id !== this.playerData.id) ?? aravaData;

    this.playerBar = new HealthBar(this, MARGIN, BAR_Y, BAR_W, BAR_H, this.playerData.maxHealth, 0x3399ff);
    this.enemyBar  = new HealthBar(this, GAME_WIDTH - MARGIN, BAR_Y, BAR_W, BAR_H, this.enemyData.maxHealth, 0xff4444, true);

    // Player name
    this.add.text(MARGIN, BAR_Y + BAR_H + 4, this.playerData.displayName, { fontSize: '16px', color: '#aaaaff' })
      .setScrollFactor(0).setDepth(32);

    // Enemy name
    this.add.text(GAME_WIDTH - MARGIN, BAR_Y + BAR_H + 4, this.enemyData.displayName, { fontSize: '16px', color: '#ffaaaa' })
      .setScrollFactor(0).setDepth(32).setOrigin(1, 0);

    // Centre-top text — shows FIGHT!, countdown, YOU WIN/LOSE
    this.roundText = this.add.text(GAME_WIDTH / 2, BAR_Y + BAR_H / 2, '', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(35).setVisible(false);

    // Large centre banner — K.O. / TIME! / FIGHT!
    this.koText = this.add.text(GAME_WIDTH / 2, 267, '', {
      fontSize: '96px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(36).setVisible(false);

    // Restart prompt
    this.restartText = this.add.text(GAME_WIDTH / 2, 400, 'Tap to restart', {
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(36).setVisible(false);

    // Combo counter (below player health bar)
    this.comboText = this.add.text(MARGIN, BAR_Y + BAR_H + 28, '', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ff8800',
      stroke: '#000000',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(35).setVisible(false);

    // ── Fullscreen toggle ──────────────────────────────────────────────────
    const fsBtn = this.add.text(GAME_WIDTH - 10, 8, '⛶', {
      fontSize: '29px', color: '#ffffffaa',
    })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(40).setAlpha(0.55)
      .setInteractive(new Phaser.Geom.Rectangle(-30, -8, 58, 44), Phaser.Geom.Rectangle.Contains)
      .on('pointerdown', () => this.scale.toggleFullscreen())
      .on('pointerover', () => fsBtn.setAlpha(1))
      .on('pointerout',  () => fsBtn.setAlpha(0.55));

    this.input.keyboard?.addKey('F').on('down', () => this.scale.toggleFullscreen());

    // ── Settings button ────────────────────────────────────────────────────
    const settingsBtn = this.add.text(GAME_WIDTH - 50, 8, '⚙', {
      fontSize: '27px', color: '#ffffffaa',
    })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(40).setAlpha(0.55)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.openSettings())
      .on('pointerover', () => settingsBtn.setAlpha(1))
      .on('pointerout',  () => settingsBtn.setAlpha(0.55));

    this.input.keyboard?.addKey('ESC').on('down', () => this.openSettings());

    // ── FightScene event bridge ────────────────────────────────────────────
    this.fightScene = this.scene.get(SCENES.FIGHT);

    this.fightScene.events.on('roundStart', () => this.showFight());

    this.fightScene.events.on('healthUpdate', (data: { playerHP: number; enemyHP: number }) => {
      this.playerBar.setValue(data.playerHP);
      this.enemyBar.setValue(data.enemyHP);
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

  update(_time: number, delta: number): void {
    this.playerBar.update(delta);
    this.enemyBar.update(delta);
  }

  private showFight(): void {
    this.showingBanner = true;
    this.koText.setText('FIGHT!').setColor('#ff3b30').setVisible(true);
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
      const color = secs <= 10 ? '#ff3b30' : '#ffffff';
      this.roundText.setText(String(secs)).setColor(color).setVisible(true);
    }
  }

  private showKO(playerWon: boolean, isTimeout: boolean): void {
    this.showingBanner = true;

    if (isTimeout) {
      this.koText.setText('TIME!').setColor('#ff9900').setVisible(true);
    } else {
      this.koText.setText('K.O.').setColor('#ffff00').setVisible(true);
    }

    const resultColor = playerWon ? '#00ff88' : '#ff4444';
    this.roundText.setText(playerWon ? 'YOU WIN!' : 'YOU LOSE!').setColor(resultColor).setVisible(true);
    this.restartText.setVisible(true);

    this.time.delayedCall(400, () => {
      this.input.once('pointerdown', () => this.doRestart());
      this.input.keyboard?.once('keydown-SPACE', () => this.doRestart());
      this.input.keyboard?.once('keydown-ENTER', () => this.doRestart());
    });
  }

  private showCombo(count: number): void {
    if (count < 2) {
      this.comboText.setVisible(false);
      return;
    }
    this.comboText.setText(`${count} HIT COMBO!`).setVisible(true).setScale(1);
    this.tweens.add({
      targets: this.comboText,
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
    this.comboText.setVisible(false);
    this.showingBanner  = false;
    this.lastTimerValue = null;

    this.playerBar.setValue(this.playerData.maxHealth);
    this.enemyBar.setValue(this.enemyData.maxHealth);

    (this.scene.get(SCENES.FIGHT) as unknown as { restart: () => void }).restart();
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }
}
