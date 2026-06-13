import Phaser from 'phaser';
import { SCENES } from '../utils/constants';

export class BootScene extends Phaser.Scene {
  constructor() { super(SCENES.BOOT); }

  create(): void {
    // Nothing to load yet — straight to preload
    this.scene.start(SCENES.PRELOAD);
  }
}
