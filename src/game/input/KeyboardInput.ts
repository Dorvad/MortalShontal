import Phaser from 'phaser';
import { InputState } from './InputState';

export class KeyboardInput {
  private keys: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    jump: Phaser.Input.Keyboard.Key;
    light: Phaser.Input.Keyboard.Key;
    heavy: Phaser.Input.Keyboard.Key;
    block: Phaser.Input.Keyboard.Key;
  };

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.keys = {
      left:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      jump:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      light: kb.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      heavy: kb.addKey(Phaser.Input.Keyboard.KeyCodes.K),
      block: kb.addKey(Phaser.Input.Keyboard.KeyCodes.L),
    };
  }

  read(): Partial<InputState> {
    return {
      left:         this.keys.left.isDown,
      right:        this.keys.right.isDown,
      jump:         Phaser.Input.Keyboard.JustDown(this.keys.jump),
      lightAttack:  Phaser.Input.Keyboard.JustDown(this.keys.light),
      heavyAttack:  Phaser.Input.Keyboard.JustDown(this.keys.heavy),
      heavyHeld:    this.keys.heavy.isDown,
      block:        this.keys.block.isDown,
    };
  }
}
