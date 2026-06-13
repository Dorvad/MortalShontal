import Phaser from 'phaser';
import { Fighter } from '../fighters/Fighter';
import { FighterInput } from '../fighters/FighterInput';
import { CombatResolver } from '../combat/CombatResolver';
import { nahoraiData } from '../data/nahorai';
import { dummyData } from '../data/dummy';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, GROUND_Y, STAGE_LEFT, STAGE_RIGHT, DEBUG_KEY } from '../utils/constants';

const ROUND_START_DELAY = 2000; // ms

export class FightScene extends Phaser.Scene {
  private player!: Fighter;
  private enemy!: Fighter;
  private playerInput!: FighterInput;
  private combat!: CombatResolver;

  private debugMode = false;
  private debugKey!: Phaser.Input.Keyboard.Key;
  private debugFpsText?: Phaser.GameObjects.Text;

  private roundPhase: 'start' | 'fight' | 'ko' = 'start';
  private roundTimer = 0;

  constructor() { super(SCENES.FIGHT); }

  create(): void {
    this.buildStage();

    this.player = new Fighter(this, nahoraiData, 250, 1);
    this.enemy  = new Fighter(this, dummyData,   710, -1);

    const isMobile = !this.sys.game.device.os.desktop;
    this.playerInput = new FighterInput(this, true, true);

    this.combat = new CombatResolver();

    this.debugKey = this.input.keyboard!.addKey(DEBUG_KEY as unknown as number);

    this.debugFpsText = this.add.text(8, 8, '', { fontSize: '14px', color: '#00ff00' })
      .setDepth(50)
      .setScrollFactor(0)
      .setVisible(false);

    // Signal UI scene
    this.roundPhase = 'start';
    this.roundTimer = ROUND_START_DELAY;
    this.events.emit('roundStart');

    void isMobile;
  }

  private buildStage(): void {
    // Sky gradient background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e).setDepth(0);

    // Ground platform
    const groundH = GAME_HEIGHT - GROUND_Y;
    this.add.rectangle(GAME_WIDTH / 2, GROUND_Y + groundH / 2, STAGE_RIGHT - STAGE_LEFT, groundH, 0x4a3728).setDepth(1);

    // Ground line
    this.add.rectangle(GAME_WIDTH / 2, GROUND_Y, STAGE_RIGHT - STAGE_LEFT, 3, 0x8b6b4a).setDepth(2);

    // Stage walls (visual)
    this.add.rectangle(STAGE_LEFT - 10, GAME_HEIGHT / 2, 20, GAME_HEIGHT, 0x2a2a3e).setDepth(1);
    this.add.rectangle(STAGE_RIGHT + 10, GAME_HEIGHT / 2, 20, GAME_HEIGHT, 0x2a2a3e).setDepth(1);

    // Background details: distant pillars
    for (let i = 0; i < 5; i++) {
      const px = STAGE_LEFT + (i + 0.5) * ((STAGE_RIGHT - STAGE_LEFT) / 5);
      this.add.rectangle(px, GROUND_Y - 60, 18, 120, 0x2a3050).setDepth(1).setAlpha(0.5);
    }
  }

  update(_time: number, delta: number): void {
    if (this.roundPhase === 'start') {
      this.roundTimer -= delta;
      if (this.roundTimer <= 0) this.roundPhase = 'fight';
      return;
    }

    if (this.roundPhase === 'ko') return;

    // Debug toggle
    if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
      this.debugMode = !this.debugMode;
      this.debugFpsText?.setVisible(this.debugMode);
    }

    const input = this.playerInput.read();

    this.player.update(delta, input);
    this.enemy.update(delta, {
      left: false, right: false, jump: false,
      lightAttack: false, heavyAttack: false, block: false,
    });

    this.combat.resolve(this.player, this.enemy);
    this.combat.resolve(this.enemy, this.player);

    this.player.updateDebug(this.debugMode);
    this.enemy.updateDebug(this.debugMode);

    if (this.debugMode) {
      this.debugFpsText?.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
    }

    // Face each other
    this.faceOpponent(this.player, this.enemy);
    this.faceOpponent(this.enemy, this.player);

    // Emit health updates to UI scene
    this.events.emit('healthUpdate', {
      playerHP: this.player.health,
      enemyHP: this.enemy.health,
    });

    // KO check
    if (this.player.health <= 0 || this.enemy.health <= 0) {
      this.roundPhase = 'ko';
      this.events.emit('ko', { playerWon: this.enemy.health <= 0 });
    }
  }

  private faceOpponent(a: Fighter, b: Fighter): void {
    if (a.state === 'idle' || a.state === 'walk') {
      a.facing = a.x < b.x ? 1 : -1;
    }
  }

  restart(): void {
    this.scene.restart();
  }
}
