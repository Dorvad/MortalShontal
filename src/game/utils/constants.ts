export const GAME_WIDTH  = 1280;
export const GAME_HEIGHT = 720;

export const GROUND_Y    = 560;
export const STAGE_LEFT  = 80;
export const STAGE_RIGHT = 1200;

export const GRAVITY = 1400;
export const MAX_FALL_SPEED = 900;

export const DEBUG_KEY = 'F1';

export const ROUND_TIME = 99;

// Hitstop freeze frames (both fighters pause briefly on hit)
export const HITSTOP_LIGHT = 3;
export const HITSTOP_HEAVY = 7;
export const HITSTOP_BLOCKED = 2;

export const SCENES = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  MENU: 'MainMenuScene',
  SELECT: 'CharacterSelectScene',
  FIGHT: 'FightScene',
  UI: 'UIScene',
  SETTINGS: 'SettingsScene',
} as const;
