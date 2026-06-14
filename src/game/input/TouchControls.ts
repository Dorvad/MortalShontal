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

  constructor(scene: Phaser.Scene) {
    const pad = 28;
    const r = 42;   // slightly larger for easier tapping
    const bottom = GAME_HEIGHT - pad - r;

    // Left side: d-pad style movement cluster
    this.btnLeft  = new TouchButton({ scene, x: pad + r,           y: bottom,              radius: r, label: '◀', color: 0x4488ff });
    this.btnRight = new TouchButton({ scene, x: pad + r * 3 + 12,  y: bottom,              radius: r, label: '▶', color: 0x4488ff });
    this.btnJump  = new TouchButton({ scene, x: pad + r * 2 + 6,   y: bottom - r * 2 - 12, radius: r, label: '▲', color: 0x44aaff });

    // Right side: action buttons
    const rx = GAME_WIDTH - pad;
    this.btnBlock = new TouchButton({ scene, x: rx - r * 3 - 12,  y: bottom,               radius: r, label: 'BLK', color: 0xffaa00 });
    this.btnLight = new TouchButton({ scene, x: rx - r,            y: bottom,               radius: r, label: 'L',   color: 0x44ff88 });
    this.btnHeavy = new TouchButton({ scene, x: rx - r * 2 - 12,  y: bottom - r * 2 - 12,  radius: r, label: 'H',   color: 0xff4444 });
  }

  read(): Partial<InputState> {
    return {
      left:        this.btnLeft.pressed,
      right:       this.btnRight.pressed,
      // One-shot: takeEdge() captures fast taps regardless of frame timing
      jump:        this.btnJump.takeEdge(),
      lightAttack: this.btnLight.takeEdge(),
      heavyAttack: this.btnHeavy.takeEdge(),
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
