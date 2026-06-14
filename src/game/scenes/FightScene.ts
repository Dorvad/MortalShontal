import Phaser from 'phaser';
import { Fighter } from '../fighters/Fighter';
import { FighterInput } from '../fighters/FighterInput';
import { CombatResolver } from '../combat/CombatResolver';
import { nahoraiData } from '../data/nahorai';
import { dummyData } from '../data/dummy';
import {
  SCENES, GAME_WIDTH, GAME_HEIGHT, GROUND_Y, STAGE_LEFT, STAGE_RIGHT,
  DEBUG_KEY, HITSTOP_LIGHT, HITSTOP_HEAVY, HITSTOP_BLOCKED,
} from '../utils/constants';

const ROUND_START_DELAY = 1800; // ms before fight begins

export class FightScene extends Phaser.Scene {
  private player!: Fighter;
  private enemy!: Fighter;
  private playerInput!: FighterInput;
  private combat!: CombatResolver;

  private debugMode = false;
  private debugKey!: Phaser.Input.Keyboard.Key;
  private debugPanel?: Phaser.GameObjects.Text;

  private roundPhase: 'start' | 'fight' | 'ko' = 'start';
  private roundTimer = 0;

  constructor() { super(SCENES.FIGHT); }

  create(): void {
    this.buildStage();

    this.player = new Fighter(this, nahoraiData, 240, 1);
    this.enemy  = new Fighter(this, dummyData,   720, -1);

    this.playerInput = new FighterInput(this, true, true);
    this.combat = new CombatResolver();

    this.debugKey = this.input.keyboard!.addKey(DEBUG_KEY as unknown as number);

    // Debug panel — visible only in debug mode
    this.debugPanel = this.add.text(10, 65, '', {
      fontSize: '13px',
      color: '#00ff44',
      backgroundColor: '#00000099',
      padding: { x: 7, y: 5 },
      lineSpacing: 3,
    })
      .setDepth(50)
      .setScrollFactor(0)
      .setVisible(false);

    this.roundPhase = 'start';
    this.roundTimer = ROUND_START_DELAY;
    this.events.emit('roundStart');
  }

  private buildStage(): void {
    if (this.textures.exists('stage_bg')) {
      // Pixel-art background — scale to fill the full game canvas
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'stage_bg')
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setDepth(0);
    } else {
      // Fallback: colored rectangles when the background image is missing
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e).setDepth(0);
      const groundH = GAME_HEIGHT - GROUND_Y;
      this.add.rectangle(GAME_WIDTH / 2, GROUND_Y + groundH / 2, STAGE_RIGHT - STAGE_LEFT, groundH, 0x3d2e1e).setDepth(1);
      this.add.rectangle(GAME_WIDTH / 2, GROUND_Y, STAGE_RIGHT - STAGE_LEFT, 4, 0x8b6b4a).setDepth(2);
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
      this.debugPanel?.setVisible(this.debugMode);
    }

    const input = this.playerInput.read();
    const dummyInput = { left: false, right: false, jump: false, lightAttack: false, heavyAttack: false, block: false };

    this.player.update(delta, input);
    this.enemy.update(delta, dummyInput);

    // Face each other (only when not committed to an attack)
    this.faceOpponent(this.player, this.enemy);
    this.faceOpponent(this.enemy, this.player);

    // Combat resolution + hitstop + screenshake
    const p2e = this.combat.resolve(this.player, this.enemy);
    const e2p = this.combat.resolve(this.enemy, this.player);

    if (p2e) this.applyHitEffects(p2e.wasBlocked, p2e.attackId);
    if (e2p) this.applyHitEffects(e2p.wasBlocked, e2p.attackId);

    this.player.updateDebug(this.debugMode);
    this.enemy.updateDebug(this.debugMode);

    if (this.debugMode) this.updateDebugPanel(delta);

    // Health events → UI scene
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

  private applyHitEffects(wasBlocked: boolean, attackId: string): void {
    if (wasBlocked) {
      this.player.freeze(HITSTOP_BLOCKED);
      this.enemy.freeze(HITSTOP_BLOCKED);
      return;
    }

    const hitstop = attackId === 'heavy' ? HITSTOP_HEAVY : HITSTOP_LIGHT;
    this.player.freeze(hitstop);
    this.enemy.freeze(hitstop);

    if (attackId === 'heavy') {
      this.cameras.main.shake(90, 0.007);
    } else {
      this.cameras.main.shake(40, 0.003);
    }
  }

  private faceOpponent(a: Fighter, b: Fighter): void {
    if (a.state === 'idle' || a.state === 'walk' || a.state === 'jump') {
      a.facing = a.x < b.x ? 1 : -1;
    }
  }

  private updateDebugPanel(delta: number): void {
    const pi = this.player.debugInfo;
    const ei = this.enemy.debugInfo;
    const fps = Math.round(this.game.loop.actualFps);

    const fmtAttack = (i: typeof pi): string => {
      if (!i.attackPhase) return '—';
      const hit = i.hasHitThisSwing ? ' ✓HIT' : '';
      return `${i.attackId} [${i.attackPhase} ${i.attackFrame}/${i.attackTotal}${hit}]`;
    };

    const lines = [
      `FPS: ${fps}  δ:${Math.round(delta)}ms`,
      `─────────────────────`,
      `Player  state: ${pi.state.padEnd(9)}  vx:${String(pi.vx).padStart(5)}  vy:${String(pi.vy).padStart(5)}  HP:${pi.health}`,
      `Enemy   state: ${ei.state.padEnd(9)}  vx:${String(ei.vx).padStart(5)}  vy:${String(ei.vy).padStart(5)}  HP:${ei.health}`,
      `─────────────────────`,
      `P attack: ${fmtAttack(pi)}`,
      `E attack: ${fmtAttack(ei)}`,
      `Hitstop P:${pi.freezeFrames}  E:${ei.freezeFrames}`,
      `Debug ON — F1 to toggle`,
    ];

    this.debugPanel?.setText(lines.join('\n'));
  }

  restart(): void {
    this.scene.restart();
  }
}
