import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './utils/constants';
import { BootScene }      from './scenes/BootScene';
import { PreloadScene }   from './scenes/PreloadScene';
import { MainMenuScene }  from './scenes/MainMenuScene';
import { FightScene }     from './scenes/FightScene';
import { UIScene }        from './scenes/UIScene';
import { SettingsScene }  from './scenes/SettingsScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias:   true,
    antialiasGL: true,
    roundPixels: false,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  input: {
    activePointers: 10,
  },
  scene: [BootScene, PreloadScene, MainMenuScene, FightScene, UIScene, SettingsScene],
};
