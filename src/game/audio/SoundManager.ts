import Phaser from 'phaser';

export class SoundManager {
  static play(scene: Phaser.Scene, key: string, volume = 0.6): void {
    if (scene.sound.get(key)) scene.sound.play(key, { volume });
  }
}
