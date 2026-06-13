import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

export class PreloadScene extends Phaser.Scene {
  constructor() { super(SCENES.PRELOAD); }

  preload(): void {
    // Placeholder — load sprite sheets here when art is ready:
    // this.load.spritesheet('nahorai', 'assets/nahorai.png', { frameWidth: 64, frameHeight: 96 });
    // this.load.spritesheet('dummy',   'assets/dummy.png',   { frameWidth: 64, frameHeight: 96 });

    const bar = this.add.rectangle(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2, 0, 20, 0x3399ff).setOrigin(0, 0.5);
    const bg  = this.add.rectangle(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2, 300, 20, 0x333333).setOrigin(0, 0.5);
    bar.setDepth(1); bg.setDepth(0);

    this.load.on('progress', (v: number) => bar.setSize(300 * v, 20));
  }

  create(): void {
    this.scene.start(SCENES.FIGHT);
    this.scene.launch(SCENES.UI);
  }
}
