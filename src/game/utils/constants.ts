export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const GROUND_Y = 420;
export const STAGE_LEFT = 60;
export const STAGE_RIGHT = 900;

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
  FIGHT: 'FightScene',
  UI: 'UIScene',
} as const;
