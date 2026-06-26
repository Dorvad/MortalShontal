import Phaser from 'phaser';
import { Fighter } from '../fighters/Fighter';
import { FighterInput } from '../fighters/FighterInput';
import { CombatResolver, HitResult } from '../combat/CombatResolver';
import { Projectile, ProjectileSpawnData } from '../combat/Projectile';
import { rectsOverlap } from '../utils/rects';
import { nahoraiData } from '../data/nahorai';
import { aravaData }   from '../data/arava';
import { tomerData }   from '../data/tomer';
import { shontalData } from '../data/shontal';
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
  private projectiles:       Projectile[] = [];

  private playerPrevState = 'idle';
  private enemyPrevState  = 'idle';

  private readonly PUNCH_KEYS = ['sfx_punch_1', 'sfx_punch_2', 'sfx_punch_3', 'sfx_punch_4'];
  private nextPunchIdx = 0;

  constructor() { super(SCENES.FIGHT); }

  create(): void {
    // Fade in from black so the scene is always visible regardless of how we arrived here.
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.buildStage();

    this.registerHitAnim('hit_light', 4, 18);  // 5 frames at 18 fps ≈ 278 ms
    this.registerHitAnim('hit_heavy', 5, 16);  // 6 frames at 16 fps ≈ 375 ms

    const roster: Record<string, import('../fighters/FighterData').FighterData> = {
      nahorai: nahoraiData, arava: aravaData, tomer: tomerData, shontal: shontalData,
    };
    const playerData = roster[GameSettings.playerCharId] ?? nahoraiData;
    const enemyData  = Object.values(roster).find(d => d.id !== playerData.id) ?? aravaData;

    this.player = new Fighter(this, playerData, 320,  1);
    this.enemy  = new Fighter(this, enemyData,  960, -1);

    this.playerInput = new FighterInput(this);
    this.ai     = new AIInput();
    this.combat = new CombatResolver();

    this.debugKey = this.input.keyboard?.addKey(DEBUG_KEY as unknown as number) as Phaser.Input.Keyboard.Key;

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
    this.projectiles       = [];
    this.playerPrevState   = 'idle';
    this.enemyPrevState    = 'idle';

    this.events.on('projectileSpawn', (data: ProjectileSpawnData) => {
      this.projectiles.push(new Projectile(this, data));
      SoundManager.play(this, 'sfx_tomer_throw', 0.65);
    });

    // Defer roundStart by one tick so UIScene (launched in the same scene-queue
    // flush) has time to run create() and register its event listeners first.
    this.time.delayedCall(0, () => this.events.emit('roundStart'));

    SoundManager.playMusic(this, 'bgm_fight');
  }

  private registerHitAnim(key: string, endFrame: number, frameRate: number): void {
    if (!this.textures.exists(key) || this.anims.exists(key)) return;
    this.anims.create({ key, frames: this.anims.generateFrameNumbers(key, { start: 0, end: endFrame }), frameRate, repeat: 0 });
  }

  private buildStage(): void {
    const bgKey = this.textures.exists(GameSettings.stageId)
      ? GameSettings.stageId
      : this.textures.exists('stage_bg') ? 'stage_bg' : null;

    if (bgKey) {
      const img = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT, bgKey)
        .setOrigin(0.5, 1)
        .setDepth(0);
      const scale = Math.max(GAME_WIDTH / img.width, GAME_HEIGHT / img.height);
      img.setScale(scale);
    } else {
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x7ec8e8).setDepth(0);
      const groundH = GAME_HEIGHT - GROUND_Y;
      this.add.rectangle(GAME_WIDTH / 2, GROUND_Y + groundH / 2, STAGE_RIGHT - STAGE_LEFT, groundH, 0xd4b896).setDepth(1);
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

    const prevPlayerState = this.playerPrevState;
    const prevEnemyState  = this.enemyPrevState;

    this.player.update(scaledDelta, input);
    this.enemy.update(scaledDelta, enemyInput);

    // Landing dust — detect jump→idle ground transition
    if (prevPlayerState === 'jump' && this.player.state === 'idle') {
      this.spawnLandingDust(this.player.x, this.player.y);
    }
    if (prevEnemyState === 'jump' && this.enemy.state === 'idle') {
      this.spawnLandingDust(this.enemy.x, this.enemy.y);
    }
    this.playerPrevState = this.player.state;
    this.enemyPrevState  = this.enemy.state;

    // Arava heavy SFX — fires once when attack starts
    if (prevPlayerState !== 'attack' && this.player.state === 'attack'
        && this.player.data.id === 'arava' && this.player.currentAttackId === 'heavy') {
      SoundManager.play(this, 'sfx_arava_heavy', 0.7);
    }
    if (prevEnemyState !== 'attack' && this.enemy.state === 'attack'
        && this.enemy.data.id === 'arava' && this.enemy.currentAttackId === 'heavy') {
      SoundManager.play(this, 'sfx_arava_heavy', 0.7);
    }

    // Face each other (only when not committed to an attack)
    this.faceOpponent(this.player, this.enemy);
    this.faceOpponent(this.enemy, this.player);

    // Projectile updates (runs in fight + dying phases so in-flight dumbbells still move)
    this.updateProjectiles(scaledDelta);

    // Combat resolution — only process hits during active fight
    if (this.roundPhase === 'fight') {
      const p2e = this.combat.resolve(this.player, this.enemy);
      const e2p = this.combat.resolve(this.enemy, this.player);

      if (p2e) {
        this.applyHitEffects(p2e, this.enemy, this.player);
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
        this.applyHitEffects(e2p, this.player, this.enemy);
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
      // White screen flash on KO
      const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff)
        .setDepth(45).setScrollFactor(0).setAlpha(0.85);
      this.tweens.add({ targets: flash, alpha: 0, duration: 380, ease: 'Quad.easeIn', onComplete: () => flash.destroy() });
      this.time.delayedCall(600, () => {
        this.roundPhase = 'ko';
        this.timeScale  = 1.0;
        this.events.emit('ko', { playerWon, isTimeout: false });
      });
    }
  }

  private applyHitEffects(result: HitResult, defender: Fighter, attacker: Fighter): void {
    const isHeavy   = result.attackId === 'heavy';
    const hitX      = defender.x;
    const hitY      = defender.y - defender.data.hurtboxH / 2;
    const sparkKey  = this.textures.exists('spark_px') ? 'spark_px' : null;

    if (result.wasBlocked) {
      this.player.freeze(HITSTOP_BLOCKED);
      this.enemy.freeze(HITSTOP_BLOCKED);
      SoundManager.play(this, 'sfx_block');
      // Blue-white block sparks fanning forward
      if (sparkKey) {
        const e = this.add.particles(hitX, hitY, sparkKey, {
          speed: { min: 40, max: 140 },
          lifespan: 220,
          scale: { start: 0.55, end: 0 },
          quantity: 6,
          tint: [0xaaddff, 0xffffff, 0x88ccff],
          angle: { min: 200, max: 340 },
        });
        this.time.delayedCall(260, () => e.destroy());
      }
      return;
    }

    const hitstop = isHeavy ? HITSTOP_HEAVY : HITSTOP_LIGHT;
    this.player.freeze(hitstop);
    this.enemy.freeze(hitstop);

    // Round-robin punch SFX
    SoundManager.play(this, this.PUNCH_KEYS[this.nextPunchIdx]);
    this.nextPunchIdx = (this.nextPunchIdx + 1) % this.PUNCH_KEYS.length;

    this.cameras.main.shake(isHeavy ? 90 : 40, isHeavy ? 0.007 : 0.003);

    // Hit sparks — attacker's color tints the burst for visual personality
    if (sparkKey) {
      const acColor = attacker.data.color;
      const tints   = isHeavy
        ? [0xffffff, acColor, 0xffee88]
        : [acColor, 0xffffff];
      const e = this.add.particles(hitX, hitY, sparkKey, {
        speed: { min: 80, max: 240 },
        lifespan: 300,
        scale: { start: isHeavy ? 0.9 : 0.6, end: 0 },
        quantity: isHeavy ? 10 : 5,
        tint: tints,
      });
      this.time.delayedCall(340, () => e.destroy());
    }

    // Hit-mark animation sprite
    const animKey = isHeavy ? 'hit_heavy' : 'hit_light';
    if (this.anims.exists(animKey)) {
      const vfx = this.add.sprite(hitX, hitY, animKey)
        .setDepth(11)
        .setScale(isHeavy ? 0.22 : 0.15)
        .play(animKey);
      vfx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => vfx.destroy());
    }

    // Floating damage number — grows with combo for visual escalation
    this.showDamageNumber(hitX, hitY - 20, result.damage, this.comboCount);
  }

  private showDamageNumber(x: number, y: number, dmg: number, combo: number): void {
    if (this.activeDamageTexts.length >= 3) return;
    const scale    = Math.min(1 + (combo - 1) * 0.18, 2.2);
    const fontSize = Math.round(22 * scale);
    const color    = combo >= 5 ? '#ff4444' : combo >= 3 ? '#ff8800' : '#ffff44';
    const txt = this.add.text(x, y, String(dmg), {
      fontSize: `${fontSize}px`, fontStyle: 'bold', color,
      stroke: '#000000', strokeThickness: Math.round(3 * scale),
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

  private updateProjectiles(delta: number): void {
    this.projectiles = this.projectiles.filter(p => p.active);
    for (const proj of this.projectiles) {
      proj.update(delta);
      if (!proj.active) continue;

      const targets = proj.ownerId === this.player.id
        ? [this.enemy]
        : [this.player];

      for (const target of targets) {
        if (proj.hitTargets.has(target.id) || !target.hurtbox.active) continue;
        if (!rectsOverlap(proj.hitRect, target.hurtbox.rect)) continue;

        proj.hitTargets.add(target.id);
        const facingSign = proj.vx > 0 ? 1 : -1;
        const result = target.takeHit({
          damage:     proj.damage,
          knockbackX: proj.knockbackX * facingSign,
          knockbackY: proj.knockbackY,
          hitstun:    proj.hitstun,
          blockstun:  proj.blockstun,
        });
        if (result !== 'immune') {
          const projOwner = proj.ownerId === this.player.id ? this.player : this.enemy;
          this.applyHitEffects(
            { wasBlocked: result === 'blocked', attackId: 'heavy', damage: proj.damage },
            target, projOwner,
          );
          // Combo tracking: if the projectile owner is the player
          if (proj.ownerId === this.player.id && result !== 'blocked') {
            this.comboCount++;
            this.comboTimer = 1200;
            this.events.emit('comboUpdate', this.comboCount);
          }
          proj.deactivate();
        }
      }
    }
  }

  private spawnLandingDust(x: number, y: number): void {
    const key = this.textures.exists('circle_px') ? 'circle_px' : 'spark_px';
    const e = this.add.particles(x, y, key, {
      speedX: { min: -80, max: 80 },
      speedY: { min: -30, max: -5 },
      lifespan: 480,
      scale:   { start: 1.4, end: 0 },
      alpha:   { start: 0.45, end: 0 },
      quantity: 6,
      tint: [0xd4b896, 0xc8ae82, 0xe0cdb0],
      gravityY: 80,
    }).setDepth(4);
    this.time.delayedCall(520, () => e.destroy());
  }

  shutdown(): void {
    // Clean up touch controls so their DOM listeners don't linger.
    this.playerInput?.destroy();
    for (const p of this.projectiles) p.deactivate();
  }

  restart(): void {
    for (const p of this.projectiles) p.deactivate();
    this.timeScale         = 1.0;
    this.comboCount        = 0;
    this.comboTimer        = 0;
    this.activeDamageTexts = [];
    this.projectiles       = [];
    this.playerPrevState   = 'idle';
    this.enemyPrevState    = 'idle';
    this.nextPunchIdx      = 0;
    this.scene.restart();
  }
}
