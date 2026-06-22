import Phaser from 'phaser';
import { GameSettings } from '../GameSettings';

export class SoundManager {
  private static currentMusicKey: string | null = null;

  // One-shot SFX — volume is the authored mix level, scaled by the user's sfxVolume master.
  static play(scene: Phaser.Scene, key: string, volume = 0.6): void {
    if (scene.sound.get(key)) {
      scene.sound.play(key, { volume: volume * GameSettings.sfxVolume });
    }
  }

  // Looping BGM — plays at musicVolume with loop:true.
  static playMusic(scene: Phaser.Scene, key: string): void {
    const snd = scene.sound.get(key);
    if (!snd) return;
    SoundManager.currentMusicKey = key;
    if (!snd.isPlaying) {
      scene.sound.play(key, { volume: GameSettings.musicVolume, loop: true });
    }
  }

  // Live-updates the currently playing music track volume.
  static applyMusicVolume(scene: Phaser.Scene): void {
    if (!SoundManager.currentMusicKey) return;
    const snd = scene.sound.get(SoundManager.currentMusicKey);
    if (snd) (snd as Phaser.Sound.WebAudioSound).setVolume(GameSettings.musicVolume);
  }
}
