import Phaser from 'phaser';
import { Fighter } from '../fighters/Fighter';
import { FighterInput } from '../fighters/FighterInput';
import { CombatResolver, HitResult } from '../combat/CombatResolver';
import { nahoraiData } from '../data/nahorai';
import { aravaData }   from '../data/arava';
import { tomerData }   from '../data/tomer';
import { AIInput }     from '../input/AIInput';
import { emptyInput }  from '../input/InputState';
import { GameSettings } from '../GameSettings';
import { SoundManager } from '../audio/SoundManager';
import {
  SCENES, GAME_WIDTH, GAME_HEIGHT, GROUND_Y, STAGE_LEFT, STAGE_RIGHT,
  DEBUG_KEY, HITSTOP_LIGHT, HITSTOP_HEAVY, HITSTOP_BLOCKED, ROUND_TIME,
} from '../utils/constants';

const ROUND_START_DELAY = 1800; // ms before fight begins

export class FightScene extends Phaser.Scene {
  private player!: Fighter;
  private enemy!: Fighter;
  private playerInput!: FighterInput;
  private ai!: AIInput;
  private combat!: CombatResolver;

  private debugMode = false;
  private debugKey!: Phaser.Input.Keyboard.Key;
  private debugPanel?: Phaser.GameObjects.Text;

  private roundPhase: 'start' | 'fight' | 'dying' | 'ko' = 'start';
  private roundTimer  = 0;   // ms countdown for round-start delay
  private matchTimer  = 0;   // seconds remaining in the round

  private comboCount       = 0;
  private comboTimer       = 0;   // ms, wall-clock countdown
  private timeScale        = 1.0;
  private activeDamageTexts: Phaser.GameObjects.Text[] = [];

  constructor() { super(SCENES.FIGHT); }

  create(): void {
    this.buildStage();

    const roster: Record<string, import('../fighters/FighterData').FighterData> = {
      nahorai: nahoraiData, arava: aravaData, tomer: tomerData,
    };
    const playerData = roster[GameSettings.playerCharId] ?? nahoraiData;
    const enemyData  = Object.values(roster).find(d => d.id !== playerData.id) ?? aravaData;

    this.player = new Fighter(this, playerData, 240,  1);
    this.enemy  = new Fighter(this, enemyData,  720, -1);

    this.playerInput = new FighterInput(this, true, true);
    this.ai     = new AIInput();
    this.combat = new CombatResolver();

    this.debugKey = this.input.keyboard!.addKey(DEBUG_KEY as unknown as number);

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

    this.roundPhase        = 'start';
    this.roundTimer        = ROUND_START_DELAY;
    this.matchTimer        = ROUND_TIME;
    this.comboCount        = 0;
    this.comboTimer        = 0;
    this.timeScale         = 1.0;
    this.activeDamageTexts = [];
    this.events.emit('roundStart');

    SoundManager.play(this, 'bgm_fight');
  }

  private buildStage(): void {
    if (this.textures.exists('stage_bg')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'stage_bg')
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setDepth(0);
    } else {
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

    // Time scale for slow-motion (set to 0.15 during dying phase)
    const scaledDelta = delta * this.timeScale;

    // Combo window — counts down in wall-clock time
    if (this.comboCount > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.events.emit('comboUpdate', 0);
      }
    }

    // ── Match timer (only ticks during active fight) ──────────────────────────
    if (this.roundPhase === 'fight' && !GameSettings.unlimitedTimer) {
      this.matchTimer -= delta / 1000;
      if (this.matchTimer <= 0) {
        this.matchTimer = 0;
        this.roundPhase = 'ko';
        const playerWon = this.player.health >= this.enemy.health;
        this.events.emit('ko', { playerWon, isTimeout: true });
        this.events.emit('timerUpdate', 0);
        return;
      }
    }
    this.events.emit('timerUpdate', GameSettings.unlimitedTimer ? null : Math.ceil(this.matchTimer));

    // Debug toggle (only during active fight)
    if (this.roundPhase === 'fight') {
      if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
        this.debugMode = !this.debugMode;
        this.debugPanel?.setVisible(this.debugMode);
      }
    }

    // Input — frozen during dying phase
    const input = this.roundPhase === 'dying'
      ? emptyInput()
      : this.playerInput.read();
    const enemyInput = (GameSettings.enemyAI && this.roundPhase === 'fight')
      ? this.ai.compute(delta, this.enemy, this.player)
      : emptyInput();

    this.player.update(scaledDelta, input);
    this.enemy.update(scaledDelta, enemyInput);

    // Face each other (only when not committed to an attack)
    this.faceOpponent(this.player, this.enemy);
    this.faceOpponent(this.enemy, this.player);

    // Combat resolution — only process hits during active fight
    if (this.roundPhase === 'fight') {
      const p2e = this.combat.resolve(this.player, this.enemy);
      const e2p = this.combat.resolve(this.enemy, this.player);

      if (p2e) {
        this.applyHitEffects(p2e, this.enemy);
        if (!p2e.wasBlocked) {
          this.comboCount++;
          this.comboTimer = 1200;
          this.events.emit('comboUpdate', this.comboCount);
        } else {
          this.comboCount = 0;
          this.events.emit('comboUpdate', 0);
        }
      }
      if (e2p) {
        this.applyHitEffects(e2p, this.player);
        if (!e2p.wasBlocked) {
          this.comboCount = 0;
          this.events.emit('comboUpdate', 0);
        }
      }
    }

    this.player.updateDebug(this.debugMode);
    this.enemy.updateDebug(this.debugMode);

    if (this.debugMode) this.updateDebugPanel(delta);

    // Health events → UI scene
    this.events.emit('healthUpdate', {
      playerHP: this.player.health,
      enemyHP:  this.enemy.health,
    });

    // KO check — trigger slow-mo then emit 'ko' after 600ms
    if (this.roundPhase === 'fight' && (this.player.health <= 0 || this.enemy.health <= 0)) {
      this.roundPhase = 'dying';
      this.timeScale  = 0.15;
      const playerWon = this.enemy.health <= 0;
      this.time.delayedCall(600, () => {
        this.roundPhase = 'ko';
        this.timeScale  = 1.0;
        this.events.emit('ko', { playerWon, isTimeout: false });
      });
    }
  }

  private applyHitEffects(result: HitResult, defender: Fighter): void {
    const isHeavy = result.attackId === 'heavy';

    if (result.wasBlocked) {
      this.player.freeze(HITSTOP_BLOCKED);
      this.enemy.freeze(HITSTOP_BLOCKED);
      SoundManager.play(this, 'sfx_block');
      return;
    }

    const hitstop = isHeavy ? HITSTOP_HEAVY : HITSTOP_LIGHT;
    this.player.freeze(hitstop);
    this.enemy.freeze(hitstop);
    SoundManager.play(this, isHeavy ? 'sfx_hit_heavy' : 'sfx_hit_light');

    if (isHeavy) {
      this.cameras.main.shake(90, 0.007);
    } else {
      this.cameras.main.shake(40, 0.003);
    }

    // Hit sparks at contact point
    const hitX = defender.x;
    const hitY = defender.y - defender.data.hurtboxH / 2;
    if (this.textures.exists('spark_px')) {
      const emitter = this.add.particles(hitX, hitY, 'spark_px', {
        speed: { min: 80, max: 220 },
        lifespan: 280,
        scale: { start: 0.6, end: 0 },
        quantity: isHeavy ? 8 : 4,
        tint: isHeavy ? [0xffffff, 0xffdd00] : [0xff8800, 0xffaa44],
      });
      this.time.delayedCall(300, () => emitter.destroy());
    }

    // Floating damage number
    this.showDamageNumber(hitX, hitY - 20, result.damage);
  }

  private showDamageNumber(x: number, y: number, dmg: number): void {
    if (this.activeDamageTexts.length >= 3) return;
    const txt = this.add.text(x, y, String(dmg), {
      fontSize: '22px', fontStyle: 'bold', color: '#ffff44',
      stroke: '#000000', strokeThickness: 3,
    }).setDepth(15).setOrigin(0.5);
    this.activeDamageTexts.push(txt);
    this.tweens.add({
      targets: txt,
      y: y - 55,
      alpha: 0,
      duration: 650,
      onComplete: () => {
        this.activeDamageTexts = this.activeDamageTexts.filter(t => t !== txt);
        txt.destroy();
      },
    });
  }

  private faceOpponent(a: Fighter, b: Fighter): void {
    if (a.state === 'idle' || a.state === 'walk' || a.state === 'jump') {
      a.facing = a.x < b.x ? 1 : -1;
    }
  }

  private updateDebugPanel(delta: number): void {
    const pi  = this.player.debugInfo;
    const ei  = this.enemy.debugInfo;
    const fps = Math.round(this.game.loop.actualFps);

    const fmtAttack = (i: typeof pi): string => {
      if (!i.attackPhase) return '—';
      const hit = i.hasHitThisSwing ? ' ✓HIT' : '';
      return `${i.attackId} [${i.attackPhase} ${i.attackFrame}/${i.attackTotal}${hit}]`;
    };

    const timerStr = GameSettings.unlimitedTimer ? '∞' : String(Math.ceil(this.matchTimer));

    const lines = [
      `FPS: ${fps}  δ:${Math.round(delta)}ms  T:${timerStr}  AI:${GameSettings.enemyAI ? 'ON' : 'OFF'}`,
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
    this.timeScale         = 1.0;
    this.comboCount        = 0;
    this.comboTimer        = 0;
    this.activeDamageTexts = [];
    this.scene.restart();
  }
}
