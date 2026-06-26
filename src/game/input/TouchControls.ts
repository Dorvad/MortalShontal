import Phaser from 'phaser';
import { InputState } from './InputState';
import { TouchButton } from '../ui/TouchButton';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { getTouchButtonSize, getTouchPad } from '../utils/device';

export class TouchControls {
  private btnLeft: TouchButton;
  private btnRight: TouchButton;
  private btnJump: TouchButton;
  private btnLight: TouchButton;
  private btnHeavy: TouchButton;
  private btnBlock: TouchButton;

  constructor(scene: Phaser.Scene) {
    const pad    = getTouchPad();
    const size   = getTouchButtonSize();
    const gap    = 12;
    const bottom = GAME_HEIGHT - pad - size / 2;

    // Left side: directional buttons + jump above
    const lx0 = pad + size / 2;
    this.btnLeft  = new TouchButton({ scene, x: lx0,                  y: bottom,           size, baseKey: 'ctrl_dir_left',  highlightKey: 'ctrl_dir_left_hl' });
    this.btnRight = new TouchButton({ scene, x: lx0 + size + gap,     y: bottom,           size, baseKey: 'ctrl_dir_right', highlightKey: 'ctrl_dir_right_hl' });
    this.btnJump  = new TouchButton({ scene, x: lx0 + (size + gap) / 2, y: bottom - size - gap, size, baseKey: 'ctrl_btn',  highlightKey: 'ctrl_btn_hl', iconKey: 'ctrl_icon_jump' });

    // Right side: action buttons
    const rx = GAME_WIDTH - pad - size / 2;
    this.btnLight = new TouchButton({ scene, x: rx,               y: bottom,           size, baseKey: 'ctrl_btn', highlightKey: 'ctrl_btn_hl', iconKey: 'ctrl_icon_sword' });
    this.btnHeavy = new TouchButton({ scene, x: rx - size - gap,  y: bottom - size - gap, size, baseKey: 'ctrl_btn', highlightKey: 'ctrl_btn_hl', iconKey: 'ctrl_icon_fire' });
    this.btnBlock = new TouchButton({ scene, x: rx - size - gap,  y: bottom,           size, baseKey: 'ctrl_btn', highlightKey: 'ctrl_btn_hl', iconKey: 'ctrl_icon_shield' });
  }

  read(): Partial<InputState> {
    return {
      left:        this.btnLeft.pressed,
      right:       this.btnRight.pressed,
      jump:        this.btnJump.takeEdge(),
      lightAttack: this.btnLight.takeEdge(),
      heavyAttack: this.btnHeavy.takeEdge(),
      heavyHeld:   this.btnHeavy.pressed,
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
