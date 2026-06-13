import Phaser from 'phaser';
import { gameConfig } from './game/config';

// Prevent default touch/scroll behavior globally
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
document.addEventListener('touchstart', (e) => {
  if ((e.target as HTMLElement).tagName !== 'INPUT') e.preventDefault();
}, { passive: false });

new Phaser.Game(gameConfig);
