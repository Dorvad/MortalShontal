import Phaser from 'phaser';
import { FighterData } from './FighterData';
import { FighterStateName } from './FighterState';
import { InputState } from '../input/InputState';
import { Hitbox, createHitbox } from '../combat/Hitbox';
import { Hurtbox, createHurtbox } from '../combat/Hurtbox';
import { GROUND_Y, STAGE_LEFT, STAGE_RIGHT, GRAVITY } from '../utils/constants';
import { AttackData } from '../combat/AttackData';

const FPS = 60;
const HITSTUN_GROUND_FRICTION = 0.72;

interface TakeHitParams {
  damage: number;
  knockbackX: number;
  knockbackY: number;
  hitstun: number;
  blockstun: number;
}

export interface FighterDebugInfo {
  id: string;
  state: FighterStateName;
  vx: number;
  vy: number;
  health: number;
  onGround: boolean;
  attackPhase: 'startup' | 'active' | 'recovery' | null;
  attackId: string | null;
  attackFrame: number;
  attackTotal: number;
  hasHitThisSwing: boolean;
  freezeFrames: number;
}

export class Fighter {
  readonly id: string;
  readonly data: FighterData;

  x: number;
  y: number;
  vx = 0;
  vy = 0;
  facing: 1 | -1 = 1; // 1 = right, -1 = left

  health: number;
  state: FighterStateName = 'idle';
  onGround = true;

  hitbox: Hitbox;
  hurtbox: Hurtbox;

  private rect: Phaser.GameObjects.Rectangle;
  // Optional sprite layer — activated automatically when textures are loaded.
  // Supported states: idle, walk, jump (rise + fall).
  // Other states (attack, block, hitstun, knockdown) still use the rectangle.
  private sprite?: Phaser.GameObjects.Sprite;
  private spriteAnims = new Set<string>(); // which Phaser anim keys are available
  private scene: Phaser.Scene;

  private stateTimer = 0;
  private currentAttack: AttackData | null = null;
  private attackPhaseName: 'startup' | 'active' | 'recovery' | null = null;
  private hasSpawnedProjectile = false;
  private ranHeavyHold = false;  // true if hold was triggered at any point this attack

  // Game-feel timers (in frames)
  private freezeFrames = 0;
  private hitFlashTimer = 0;
  private blockFlashTimer = 0;
  private landingSquash = 0;
  private wasOnGround = true;

  // Debug overlays
  private debugHurtboxRect?: Phaser.GameObjects.Rectangle;
  private debugHitboxRect?: Phaser.GameObjects.Rectangle;
  private debugLabel?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, data: FighterData, startX: number, facing: 1 | -1) {
    this.scene = scene;
    this.data = data;
    this.id = data.id;
    this.health = data.maxHealth;
    this.x = startX;
    this.y = GROUND_Y;
    this.facing = facing;

    this.hitbox  = createHitbox();
    this.hurtbox = createHurtbox();

    this.rect = scene.add.rectangle(this.x, this.y, data.width, data.height, data.color)
      .setOrigin(0.5, 1)
      .setDepth(5);

    this.initDebugOverlays();
    this.trySetupSprite();
  }

  // ── Sprite layer ────────────────────────────────────────────────────────────
  // Registers all available animations and creates the sprite game object.
  // Called once from the constructor.  Safe to call even if no textures are
  // loaded — the fighter stays a rectangle in that case.
  private trySetupSprite(): void {
    const k = this.data.spriteKey;
    const af = this.data.animFrames;
    if (!k || !af) return;

    const register = (texKey: string, animKey: string, afKey: string): boolean => {
      const frames = af[afKey];
      if (!frames) return false;
      if (!this.scene.textures.exists(texKey)) return false;
      if (!this.scene.anims.exists(animKey)) {
        this.scene.anims.create({
          key: animKey,
          frames: frames.frames
            ? this.scene.anims.generateFrameNumbers(texKey, { frames: frames.frames })
            : this.scene.anims.generateFrameNumbers(texKey, { start: frames.start, end: frames.end }),
          frameRate: frames.frameRate,
          repeat:    frames.repeat,
        });
      }
      this.spriteAnims.add(animKey);
      return true;
    };

    // Register all available animation sheets
    register(`${k}_idle`, `${k}_idle`, 'idle');
    register(`${k}_walk`, `${k}_walk`, 'walk');
    register(`${k}_jump`, `${k}_jump_rise`, 'jump_rise');
    register(`${k}_jump`, `${k}_jump_fall`, 'jump_fall');
    register(`${k}_jump`, `${k}_jump_land`, 'jump_land');

    // Single-frame combat sprites (block, hitstun — each loaded as a plain image)
    const registerSingle = (texKey: string, animKey: string, repeat: number): void => {
      if (!this.scene.textures.exists(texKey)) return;
      if (!this.scene.anims.exists(animKey)) {
        this.scene.anims.create({
          key: animKey,
          frames: [{ key: texKey }],
          frameRate: 1,
          repeat,
        });
      }
      this.spriteAnims.add(animKey);
    };
    registerSingle(`${k}_block`,   `${k}_block`,   -1);
    registerSingle(`${k}_hitstun`, `${k}_hitstun`, 0);

    // Light attack: 2 separate single-frame images timed to match startup/active phases
    if (this.scene.textures.exists(`${k}_light1`) && this.scene.textures.exists(`${k}_light2`)) {
      const lightAnimKey = `${k}_light_attack`;
      if (!this.scene.anims.exists(lightAnimKey)) {
        const lightAtk = this.data.attacks['light'];
        const startupMs = lightAtk ? Math.round(lightAtk.startup * 1000 / FPS) : 50;
        const activeMs  = lightAtk ? Math.round(lightAtk.active  * 1000 / FPS) : 83;
        this.scene.anims.create({
          key: lightAnimKey,
          frames: [
            { key: `${k}_light1`, duration: startupMs }, // windup
            { key: `${k}_light2`, duration: activeMs  }, // punch extended (hitbox active)
          ],
          repeat: 0,
        });
      }
      this.spriteAnims.add(`${k}_light_attack`);
    }

    // Heavy attack: N-frame spritesheet; first 2 = startup, middle = active, last = recovery
    if (this.scene.textures.exists(`${k}_heavy`)) {
      const heavyAnimKey = `${k}_heavy_attack`;
      const heavyHoldKey = `${k}_heavy_hold`;
      const heavyAtk   = this.data.attacks['heavy'];
      const N          = this.scene.textures.get(`${k}_heavy`).frameTotal - 1; // subtract __BASE
      const nStartup   = Math.min(2, N - 2);
      const nActive    = Math.max(1, N - nStartup - 1);
      if (!this.scene.anims.exists(heavyAnimKey)) {
        const startupMs  = heavyAtk ? Math.round(heavyAtk.startup  * 1000 / FPS / Math.max(1, nStartup)) : 100;
        const activeMs   = heavyAtk ? Math.round(heavyAtk.active   * 1000 / FPS / nActive)               : 33;
        const recoveryMs = heavyAtk ? Math.round(heavyAtk.recovery * 1000 / FPS)                         : 367;
        const frameList: { key: string; frame: number; duration: number }[] = [];
        for (let i = 0; i < N; i++) {
          const ms = i < nStartup ? startupMs : i < nStartup + nActive ? activeMs : recoveryMs;
          frameList.push({ key: `${k}_heavy`, frame: i, duration: ms });
        }
        this.scene.anims.create({ key: heavyAnimKey, frames: frameList, repeat: 0 });
        // Looping cloud variant: only active frames, repeats indefinitely while button held
        if (heavyAtk?.holdable) {
          this.scene.anims.create({
            key:    heavyHoldKey,
            frames: frameList.slice(nStartup, nStartup + nActive),
            repeat: -1,
          });
        }
      }
      this.spriteAnims.add(heavyAnimKey);
      if (heavyAtk?.holdable && this.scene.anims.exists(heavyHoldKey)) {
        this.spriteAnims.add(heavyHoldKey);
      }
    }

    // Texture filtering: LINEAR for high-res downscaled art, NEAREST for pixel art upscaled
    const filterMode = this.data.spriteFilter === 'nearest'
      ? Phaser.Textures.FilterMode.NEAREST
      : Phaser.Textures.FilterMode.LINEAR;
    for (const texKey of [`${k}_idle`, `${k}_walk`, `${k}_jump`, `${k}_block`, `${k}_light1`, `${k}_light2`, `${k}_hitstun`, `${k}_heavy`]) {
      if (this.scene.textures.exists(texKey)) {
        this.scene.textures.get(texKey).setFilter(filterMode);
      }
    }

    if (this.spriteAnims.size === 0) return;

    // Pick any available texture to instantiate the sprite
    const firstTex =
      this.scene.textures.exists(`${k}_idle`) ? `${k}_idle` :
      this.scene.textures.exists(`${k}_walk`) ? `${k}_walk` :
      `${k}_jump`;

    this.sprite = this.scene.add.sprite(this.x, this.y, firstTex)
      .setOrigin(0.5, 1)
      .setDepth(6);

    // Prime the sprite to idle at the correct scale and facing direction so it
    // renders properly before Fighter.update() is first called (e.g. during the
    // round-start delay).  Without this, the frame realHeight is 1 → massive scale.
    const idleKey = `${k}_idle`;
    if (this.spriteAnims.has(idleKey)) {
      this.sprite.play(idleKey);
      const targetH = this.data.spriteDisplayHeight ?? 110;
      const scale   = targetH / this.sprite.frame.realHeight;
      this.sprite.setScale(scale);
    }
    this.sprite.setFlipX(this.facing === -1);
    this.rect.setVisible(false);
  }

  // Returns the Phaser animation key for the current state, or null (→ rect).
  private getSpriteAnimKey(): string | null {
    const k = this.data.spriteKey;
    if (!k) return null;
    switch (this.state) {
      case 'idle':
        if (this.landingSquash > 0 && this.spriteAnims.has(`${k}_jump_land`)) return `${k}_jump_land`;
        return this.spriteAnims.has(`${k}_idle`) ? `${k}_idle` : null;
      case 'walk':   return this.spriteAnims.has(`${k}_walk`) ? `${k}_walk` : null;
      case 'jump':
        if (this.vy <= 0 && this.spriteAnims.has(`${k}_jump_rise`)) return `${k}_jump_rise`;
        if (this.vy  > 0 && this.spriteAnims.has(`${k}_jump_fall`)) return `${k}_jump_fall`;
        return null;
      case 'block':
        return this.spriteAnims.has(`${k}_block`) ? `${k}_block` : null;
      case 'hitstun':
      case 'knockdown':
        return this.spriteAnims.has(`${k}_hitstun`) ? `${k}_hitstun` : null;
      case 'attack':
        if (this.currentAttack?.id === 'light' && this.spriteAnims.has(`${k}_light_attack`)) {
          return `${k}_light_attack`;
        }
        if (this.currentAttack?.id === 'heavy') {
          // After startup: use the looping cloud anim when hold was triggered (active + recovery)
          if (this.attackPhaseName !== 'startup' && this.ranHeavyHold && this.spriteAnims.has(`${k}_heavy_hold`)) {
            return `${k}_heavy_hold`;
          }
          if (this.spriteAnims.has(`${k}_heavy_attack`)) return `${k}_heavy_attack`;
        }
        return null;
      default:
        return null;
    }
  }

  private initDebugOverlays(): void {
    this.debugHurtboxRect = this.scene.add.rectangle(0, 0, 0, 0)
      .setStrokeStyle(2, 0x00ff00, 1)
      .setFillStyle(0x00ff00, 0.1)
      .setDepth(20)
      .setVisible(false);

    this.debugHitboxRect = this.scene.add.rectangle(0, 0, 0, 0)
      .setStrokeStyle(2, 0xff0000, 1)
      .setFillStyle(0xff0000, 0.15)
      .setDepth(20)
      .setVisible(false);

    this.debugLabel = this.scene.add.text(0, 0, '', {
      fontSize: '11px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2,
    })
      .setDepth(21)
      .setVisible(false);
  }

  update(dt: number, input: InputState): void {
    const dtFrames = dt / (1000 / FPS);

    // Hitstop freeze: skip game logic but still render
    if (this.freezeFrames > 0) {
      this.freezeFrames = Math.max(0, this.freezeFrames - dtFrames);
      this.syncVisuals(0);
      return;
    }

    this.stateTimer = Math.max(0, this.stateTimer - dtFrames);

    switch (this.state) {
      case 'idle':     this.updateIdle(input);   break;
      case 'walk':     this.updateWalk(input);   break;
      case 'jump':     this.updateJump(input);   break;
      case 'attack':   this.updateAttack(input); break;
      case 'block':    this.updateBlock(input);  break;
      case 'hitstun':  this.updateHitstun();     break;
      case 'knockdown': this.updateKnockdown();  break;
    }

    this.applyGravity(dt);
    this.applyMovement(dt, dtFrames);
    this.syncVisuals(dtFrames);
    this.syncBoxes();
  }

  private updateIdle(input: InputState): void {
    this.vx = 0;
    this.hitbox.active = false;

    if (input.block)        { this.setState('block'); return; }
    if (input.lightAttack)  { this.startAttack('light'); return; }
    if (input.heavyAttack)  { this.startAttack('heavy'); return; }
    if (input.jump)         { this.startJump(); return; }
    if (input.left || input.right) { this.setState('walk'); }
  }

  private updateWalk(input: InputState): void {
    if (input.block)        { this.setState('block'); return; }
    if (input.lightAttack)  { this.startAttack('light'); return; }
    if (input.heavyAttack)  { this.startAttack('heavy'); return; }
    if (input.jump)         { this.startJump(); return; }

    if (input.left) {
      this.vx = -this.data.walkSpeed;
      this.facing = -1;
    } else if (input.right) {
      this.vx = this.data.walkSpeed;
      this.facing = 1;
    } else {
      this.vx = 0;
      this.setState('idle');
    }
  }

  private updateJump(input: InputState): void {
    if (this.onGround) {
      this.setState('idle');
      return;
    }
    if (input.lightAttack) { this.startAttack('light'); return; }
    if (input.heavyAttack) { this.startAttack('heavy'); return; }

    const airSpeed = this.data.walkSpeed * this.data.airControl;
    if (input.left) {
      this.vx = -airSpeed;
      this.facing = -1;
    } else if (input.right) {
      this.vx = airSpeed;
      this.facing = 1;
    } else {
      // Gentle air drift deceleration (not instant stop)
      this.vx *= 0.88;
    }
  }

  private updateAttack(input: InputState): void {
    if (!this.currentAttack) { this.setState('idle'); return; }

    const atk = this.currentAttack;
    const total = atk.startup + atk.active + atk.recovery;
    const elapsed = total - this.stateTimer;

    if (elapsed < atk.startup) {
      this.attackPhaseName = 'startup';
      this.hitbox.active = false;
    } else if (elapsed < atk.startup + atk.active) {
      this.attackPhaseName = 'active';
      if (atk.projectile) {
        this.hitbox.active = false;
        if (!this.hasSpawnedProjectile) {
          this.hasSpawnedProjectile = true;
          this.scene.events.emit('projectileSpawn', {
            x:          this.x + atk.projectile.launchOffsetX * this.facing,
            y:          this.y + atk.projectile.launchOffsetY,
            vx:         atk.projectile.speed * this.facing,
            damage:     atk.damage,
            knockbackX: atk.knockbackX,
            knockbackY: atk.knockbackY,
            hitstun:    atk.hitstun,
            blockstun:  atk.blockstun,
            hitW:       atk.projectile.hitW,
            hitH:       atk.projectile.hitH,
            spriteKey:  atk.projectile.spriteKey,
            displayScale: atk.projectile.displayScale,
            ownerId:    this.id,
          });
        }
      } else {
        this.hitbox.active = true;
        // Hold mechanic: while the button stays held, prevent the timer from entering recovery
        if (atk.holdable && input.heavyAttack) {
          this.ranHeavyHold = true;
          this.stateTimer = Math.max(this.stateTimer, atk.recovery + 1);
        }
      }
    } else {
      this.attackPhaseName = 'recovery';
      this.hitbox.active = false;
    }

    if (this.stateTimer <= 0) {
      this.hitbox.active = false;
      this.hitbox.hitTargets.clear();
      this.currentAttack = null;
      this.attackPhaseName = null;
      this.ranHeavyHold = false;
      this.setState('idle');
    }
  }

  private updateBlock(input: InputState): void {
    this.vx = 0;
    this.hitbox.active = false;
    if (!input.block) this.setState('idle');
  }

  private updateHitstun(): void {
    this.hitbox.active = false;
    // Ground friction bleeds off sliding momentum
    if (this.onGround) {
      this.vx *= HITSTUN_GROUND_FRICTION;
      if (Math.abs(this.vx) < 4) this.vx = 0;
    }
    if (this.stateTimer <= 0 && this.onGround) this.setState('idle');
  }

  private updateKnockdown(): void {
    this.hitbox.active = false;
    if (this.onGround) {
      this.vx *= 0.8;
      if (Math.abs(this.vx) < 4) this.vx = 0;
    }
    if (this.stateTimer <= 0) this.setState('idle');
  }

  private startAttack(id: 'light' | 'heavy'): void {
    const atk = this.data.attacks[id];
    if (!atk) return;

    this.currentAttack         = atk;
    this.hasSpawnedProjectile  = false;
    this.ranHeavyHold          = false;
    this.hitbox.attackId       = atk.id;
    this.hitbox.damage         = atk.damage;
    this.hitbox.knockbackX     = atk.knockbackX;
    this.hitbox.knockbackY     = atk.knockbackY;
    this.hitbox.hitstun        = atk.hitstun;
    this.hitbox.blockstun      = atk.blockstun;
    this.hitbox.hitTargets.clear();
    this.hitbox.active         = false;

    this.stateTimer = atk.startup + atk.active + atk.recovery;
    this.state = 'attack';
    this.vx = 0;
  }

  private startJump(): void {
    if (!this.onGround) return;
    this.vy = this.data.jumpVelocity;
    this.onGround = false;
    this.setState('jump');
  }

  private setState(s: FighterStateName): void {
    this.state = s;
    this.stateTimer = 0;
  }

  private applyGravity(dt: number): void {
    if (!this.onGround) {
      this.vy = Math.min(this.vy + GRAVITY * (dt / 1000), this.data.maxFallSpeed);
    }
  }

  private applyMovement(dt: number, _dtFrames: number): void {
    this.wasOnGround = this.onGround;

    this.x += this.vx * (dt / 1000);
    this.y += this.vy * (dt / 1000);

    if (this.y >= GROUND_Y) {
      this.y = GROUND_Y;
      this.vy = 0;
      if (!this.wasOnGround) {
        // Just landed — trigger squash
        this.landingSquash = 5;
        if (this.state === 'jump') this.setState('idle');
      }
      this.onGround = true;
    }

    const halfW = this.data.width / 2;
    this.x = Phaser.Math.Clamp(this.x, STAGE_LEFT + halfW, STAGE_RIGHT - halfW);
  }

  private syncVisuals(dtFrames: number): void {
    const animKey = this.getSpriteAnimKey();
    const useSprite = !!this.sprite && !!animKey;

    if (useSprite && this.sprite) {
      this.rect.setVisible(false);
      this.syncSpriteVisuals(this.sprite, animKey!, dtFrames);
    } else {
      this.sprite?.setVisible(false);
      this.syncRectVisuals(dtFrames);
    }
  }

  // Sprite visual update: position, animation, scale, tint.
  private syncSpriteVisuals(spr: Phaser.GameObjects.Sprite, animKey: string, dtFrames: number): void {
    spr.setPosition(this.x, this.y).setVisible(true);

    // Per-frame horizontal anchor compensation — counters position drift in the spritesheet.
    // Offsets are stored in source pixels and scaled by the current sprite scale.
    const frameOffsets = this.data.spriteFrameOffsets?.[animKey];
    if (frameOffsets) {
      const texFrame = spr.anims.currentFrame?.textureFrame as number | undefined ?? 0;
      const rawOffset = frameOffsets[texFrame] ?? 0;
      spr.x += rawOffset * spr.scale * this.facing;
    }

    // Play animation — ignoreIfPlaying=true avoids restarting the same anim each frame;
    // false forces an immediate switch when the desired anim changes (e.g. rise → fall).
    const currentKey = spr.anims.currentAnim?.key;
    if (currentKey !== animKey) {
      spr.play(animKey, false);
    }

    // Scale: uniform so the sprite renders at spriteDisplayHeight game-pixels tall.
    const targetH = this.data.spriteDisplayHeightOverrides?.[animKey]
      ?? this.data.spriteDisplayHeight ?? 110;
    const scale   = targetH / spr.frame.realHeight;

    // Landing squash-and-stretch
    if (this.landingSquash > 0) {
      const t = this.landingSquash / 5;
      spr.setScale(scale * (1 + 0.12 * t), scale * (1 - 0.12 * t));
      this.landingSquash = Math.max(0, this.landingSquash - dtFrames);
    } else {
      spr.setScale(scale);
    }
    spr.setFlipX(this.facing === -1);

    // Hit / block tint feedback
    if (this.hitFlashTimer > 0) {
      spr.setTint(0xffffff).setAlpha(1);
      this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dtFrames);
    } else if (this.blockFlashTimer > 0) {
      spr.setTint(0xaaddff).setAlpha(0.9);
      this.blockFlashTimer = Math.max(0, this.blockFlashTimer - dtFrames);
    } else {
      spr.clearTint().setAlpha(1);
    }
  }

  // Rectangle visual update: used for states without a sprite sheet yet.
  private syncRectVisuals(dtFrames: number): void {
    this.rect.setPosition(this.x, this.y).setVisible(true);

    // ── Scale (squash-and-stretch) ───────────────────────────────────────────
    let scaleX = this.facing as number;
    let scaleY = 1;

    if (this.landingSquash > 0) {
      const t = this.landingSquash / 5;
      scaleX = this.facing * (1 + 0.18 * t);
      scaleY = 1 - 0.18 * t;
      this.landingSquash = Math.max(0, this.landingSquash - dtFrames);
    } else if (this.state === 'attack') {
      if (this.attackPhaseName === 'startup') {
        scaleX = this.facing * 0.88; scaleY = 1.1;
      } else if (this.attackPhaseName === 'active') {
        scaleX = this.facing * 1.14; scaleY = 0.9;
      } else {
        scaleX = this.facing * 0.95; scaleY = 1.04;
      }
    } else if (this.state === 'jump' && !this.onGround) {
      scaleX = this.facing * 0.9; scaleY = 1.1;
    } else if (this.state === 'knockdown') {
      scaleX = this.facing * 1.4; scaleY = 0.55;
    }

    this.rect.setScale(scaleX, scaleY);

    // ── Color / alpha ────────────────────────────────────────────────────────
    if (this.hitFlashTimer > 0) {
      this.rect.setFillStyle(0xffffff).setAlpha(1);
      this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dtFrames);
    } else if (this.blockFlashTimer > 0) {
      this.rect.setFillStyle(0xaaddff).setAlpha(0.95);
      this.blockFlashTimer = Math.max(0, this.blockFlashTimer - dtFrames);
    } else if (this.state === 'block') {
      this.rect.setFillStyle(this.data.color).setAlpha(0.55);
    } else if (this.state === 'attack' && this.attackPhaseName === 'startup') {
      this.rect.setFillStyle(this.data.color).setAlpha(0.75);
    } else {
      this.rect.setFillStyle(this.data.color).setAlpha(1);
    }
  }

  private syncBoxes(): void {
    const hw = this.data.hurtboxW / 2;

    this.hurtbox.rect.x = this.x - hw + this.data.hurtboxOffsetX * this.facing;
    this.hurtbox.rect.y = this.y - this.data.hurtboxH + this.data.hurtboxOffsetY;
    this.hurtbox.rect.w = this.data.hurtboxW;
    this.hurtbox.rect.h = this.data.hurtboxH;
    this.hurtbox.active = this.state !== 'knockdown';

    if (this.currentAttack && this.hitbox.active) {
      const off = this.currentAttack.hitboxOffset;
      this.hitbox.rect.x = this.x + off.x * this.facing - (this.facing === -1 ? off.w : 0);
      this.hitbox.rect.y = this.y + off.y;
      this.hitbox.rect.w = off.w;
      this.hitbox.rect.h = off.h;
    }
  }

  takeHit(params: TakeHitParams): 'hit' | 'blocked' | 'immune' {
    if (this.state === 'knockdown') return 'immune';

    if (this.state === 'block') {
      // Only block attacks coming from the front
      const isFrontHit =
        (params.knockbackX > 0 && this.facing === -1) ||
        (params.knockbackX < 0 && this.facing === 1);
      if (isFrontHit) {
        this.vx = params.knockbackX * 0.25;
        this.stateTimer = params.blockstun;
        this.blockFlashTimer = 4;
        return 'blocked';
      }
    }

    this.health = Math.max(0, this.health - params.damage);
    // knockbackX from CombatResolver is already directional (hb.knockbackX * attacker.facing)
    this.vx = params.knockbackX;
    this.vy = params.knockbackY;
    this.hitFlashTimer = 8;

    if (this.health <= 0) {
      this.state = 'knockdown';
      this.stateTimer = 90;
      this.hitbox.active = false;
      return 'hit';
    }

    this.onGround = false;
    this.state = 'hitstun';
    this.stateTimer = params.hitstun;
    this.hitbox.active = false;
    return 'hit';
  }

  freeze(frames: number): void {
    this.freezeFrames = Math.max(this.freezeFrames, frames);
  }

  get debugInfo(): FighterDebugInfo {
    const atk = this.currentAttack;
    const total = atk ? atk.startup + atk.active + atk.recovery : 0;
    const frame = atk ? Math.round(total - this.stateTimer) : 0;

    return {
      id: this.id,
      state: this.state,
      vx: Math.round(this.vx),
      vy: Math.round(this.vy),
      health: Math.round(this.health),
      onGround: this.onGround,
      attackPhase: this.attackPhaseName,
      attackId: atk?.id ?? null,
      attackFrame: Math.max(0, Math.min(frame, total)),
      attackTotal: total,
      hasHitThisSwing: this.hitbox.hitTargets.size > 0,
      freezeFrames: Math.round(this.freezeFrames),
    };
  }

  updateDebug(visible: boolean): void {
    if (!visible) {
      this.debugHurtboxRect?.setVisible(false);
      this.debugHitboxRect?.setVisible(false);
      this.debugLabel?.setVisible(false);
      return;
    }
    this.debugHurtboxRect?.setVisible(true);
    this.debugLabel?.setVisible(true);
    this.updateDebugOverlays();
  }

  private updateDebugOverlays(): void {
    // Hurtbox
    const hurt = this.hurtbox.rect;
    this.debugHurtboxRect
      ?.setPosition(hurt.x + hurt.w / 2, hurt.y + hurt.h / 2)
      .setSize(hurt.w, hurt.h);

    // Hitbox — only show during active frames
    if (this.hitbox.active) {
      const hb = this.hitbox.rect;
      this.debugHitboxRect
        ?.setPosition(hb.x + hb.w / 2, hb.y + hb.h / 2)
        .setSize(hb.w, hb.h)
        .setVisible(true);
    } else {
      this.debugHitboxRect?.setSize(0, 0).setVisible(false);
    }

    // Label above fighter
    const info = this.debugInfo;
    let label = `${info.id} | ${info.state}`;
    if (info.attackPhase) {
      const hitMarker = info.hasHitThisSwing ? ' ✓HIT' : '';
      label += ` [${info.attackPhase} ${info.attackFrame}/${info.attackTotal}${hitMarker}]`;
    }
    if (info.freezeFrames > 0) label += ` ⏸${info.freezeFrames}`;

    this.debugLabel
      ?.setPosition(this.x - 40, this.y - this.data.height - 22)
      .setText(label);
  }

  destroy(): void {
    this.rect.destroy();
    this.sprite?.destroy();
    this.debugHurtboxRect?.destroy();
    this.debugHitboxRect?.destroy();
    this.debugLabel?.destroy();
  }
}
