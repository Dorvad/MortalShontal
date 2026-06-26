import { InputState, emptyInput } from '../input/InputState';
import { KeyboardInput } from '../input/KeyboardInput';
import { TouchControls } from '../input/TouchControls';
import { isTouchPreferred } from '../utils/device';
import Phaser from 'phaser';

export class FighterInput {
  private keyboard?: KeyboardInput;
  private touch?: TouchControls;

  constructor(scene: Phaser.Scene, useKeyboard = true, useTouch?: boolean) {
    const enableTouch = useTouch ?? isTouchPreferred();
    if (useKeyboard) this.keyboard = new KeyboardInput(scene);
    if (enableTouch) this.touch    = new TouchControls(scene);
  }

  read(): InputState {
    const state = emptyInput();
    const kb = this.keyboard?.read() ?? {};
    const tc = this.touch?.read() ?? {};

    state.left        = !!(kb.left        || tc.left);
    state.right       = !!(kb.right       || tc.right);
    state.jump        = !!(kb.jump        || tc.jump);
    state.lightAttack = !!(kb.lightAttack || tc.lightAttack);
    state.heavyAttack = !!(kb.heavyAttack || tc.heavyAttack);
    state.heavyHeld   = !!(kb.heavyHeld   || tc.heavyHeld);
    state.block       = !!(kb.block       || tc.block);

    return state;
  }

  destroy(): void {
    this.touch?.destroy();
  }
}
