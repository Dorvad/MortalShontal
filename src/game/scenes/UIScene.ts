import Phaser from 'phaser';
import { HealthBar } from '../ui/HealthBar';
import { SCENES, GAME_WIDTH } from '../utils/constants';
import { nahoraiData } from '../data/nahorai';
import { dummyData } from '../data/dummy';

const BAR_W = 320;
const BAR_H = 22;
const BAR_Y = 24;
const MARGIN = 20;

export class UIScene extends Phaser.Scene {
  private playerBar!: HealthBar;
  private enemyBar!: HealthBar;

  private roundText!: Phaser.GameObjects.Text;
  private koText!: Phaser.GameObjects.Text;
  private restartText!: Phaser.GameObjects.Text;

  private fightScene!: Phaser.Scene;

  constructor() { super({ key: SCENES.UI, active: false }); }

  create(): void {
    this.playerBar = new HealthBar(this, MARGIN, BAR_Y, BAR_W, BAR_H, nahoraiData.maxHealth, 0x3399ff);
    this.enemyBar  = new HealthBar(this, GAME_WIDTH - MARGIN, BAR_Y, BAR_W, BAR_H, dummyData.maxHealth, 0xff4444, true);

    // Player name
    this.add.text(MARGIN, BAR_Y + BAR_H + 4, nahoraiData.displayName, { fontSize: '12px', color: '#aaaaff' })
      .setScrollFactor(0).setDepth(32);

    // Enemy name
    this.add.text(GAME_WIDTH - MARGIN, BAR_Y + BAR_H + 4, dummyData.displayName, { fontSize: '12px', color: '#ffaaaa' })
      .setScrollFactor(0).setDepth(32).setOrigin(1, 0);

    // Round timer placeholder
    this.roundText = this.add.text(GAME_WIDTH / 2, BAR_Y + BAR_H / 2, 'FIGHT!', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(35);

    // KO text
    this.koText = this.add.text(GAME_WIDTH / 2, 200, 'K.O.', {
      fontSize: '72px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(36).setVisible(false);

    // Restart text
    this.restartText = this.add.text(GAME_WIDTH / 2, 290, 'Tap to restart', {
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(36).setVisible(false);

    this.fightScene = this.scene.get(SCENES.FIGHT);

    this.fightScene.events.on('roundStart', () => {
      this.showFight();
    });

    this.fightScene.events.on('healthUpdate', (data: { playerHP: number; enemyHP: number }) => {
      this.playerBar.setValue(data.playerHP);
      this.enemyBar.setValue(data.enemyHP);
    });

    this.fightScene.events.on('ko', (data: { playerWon: boolean }) => {
      this.showKO(data.playerWon);
    });
  }

  private showFight(): void {
    this.roundText.setText('FIGHT!').setVisible(true);
    this.time.delayedCall(1500, () => this.roundText.setVisible(false));
  }

  private showKO(playerWon: boolean): void {
    this.koText.setVisible(true);
    this.roundText.setText(playerWon ? 'YOU WIN!' : 'YOU LOSE!').setVisible(true);
    this.restartText.setVisible(true);

    this.time.delayedCall(400, () => {
      this.input.once('pointerdown', () => this.doRestart());

      // Also allow keyboard restart
      this.input.keyboard?.once('keydown-SPACE', () => this.doRestart());
      this.input.keyboard?.once('keydown-ENTER', () => this.doRestart());
    });
  }

  private doRestart(): void {
    this.koText.setVisible(false);
    this.roundText.setVisible(false);
    this.restartText.setVisible(false);

    this.playerBar.setValue(nahoraiData.maxHealth);
    this.enemyBar.setValue(dummyData.maxHealth);

    (this.scene.get(SCENES.FIGHT) as unknown as { restart: () => void }).restart();
  }
}
