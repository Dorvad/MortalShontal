import Phaser from 'phaser';
import { InputState } from './InputState';
import { TouchButton } from '../ui/TouchButton';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

export class TouchControls {
  private btnLeft: TouchButton;
  private btnRight: TouchButton;
  private btnJump: TouchButton;
  private btnLight: TouchButton;
  private btnHeavy: TouchButton;
  private btnBlock: TouchButton;

  // Track previous held state for edge detection
  private prevJump = false;
  private prevLight = false;
  private prevHeavy = false;

  constructor(scene: Phaser.Scene) {
    const pad = 30;
    const r = 38;
    const bottom = GAME_HEIGHT - pad - r;

    // Left side: movement d-pad style
    this.btnLeft  = new TouchButton({ scene, x: pad + r,            y: bottom, radius: r, label: '◀', color: 0x4488ff });
    this.btnRight = new TouchButton({ scene, x: pad + r * 3 + 10,   y: bottom, radius: r, label: '▶', color: 0x4488ff });
    this.btnJump  = new TouchButton({ scene, x: pad + r * 2 + 5,    y: bottom - r * 2 - 10, radius: r, label: '▲', color: 0x44aaff });

    // Right side: action buttons
    const rx = GAME_WIDTH - pad;
    this.btnBlock = new TouchButton({ scene, x: rx - r * 3 - 10, y: bottom, radius: r, label: 'BLK', color: 0xffaa00 });
    this.btnLight = new TouchButton({ scene, x: rx - r,           y: bottom, radius: r, label: 'L',   color: 0x44ff88 });
    this.btnHeavy = new TouchButton({ scene, x: rx - r * 2 - 10,  y: bottom - r * 2 - 10, radius: r, label: 'H', color: 0xff4444 });
  }

  read(): Partial<InputState> {
    const jumpHeld  = this.btnJump.pressed;
    const lightHeld = this.btnLight.pressed;
    const heavyHeld = this.btnHeavy.pressed;

    const jump        = jumpHeld  && !this.prevJump;
    const lightAttack = lightHeld && !this.prevLight;
    const heavyAttack = heavyHeld && !this.prevHeavy;

    this.prevJump  = jumpHeld;
    this.prevLight = lightHeld;
    this.prevHeavy = heavyHeld;

    return {
      left:        this.btnLeft.pressed,
      right:       this.btnRight.pressed,
      jump,
      lightAttack,
      heavyAttack,
      block:       this.btnBlock.pressed,
    };
  }

  destroy(): void {
    this.btnLeft.destroy();
    this.btnRight.destroy();
    this.btnJump.destroy();
    this.btnLight.destroy();
    this.btnHeavy.destroy();
    this.btnBlock.destroy();
  }
}
