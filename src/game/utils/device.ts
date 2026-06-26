/** True when the device supports touch and coarse pointer (phones/tablets). */
export function isTouchPreferred(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const touch  = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return coarse || touch;
}

/** Scale factor for HUD / touch UI elements in game coordinates. */
export function getUIScale(): number {
  return isTouchPreferred() ? 1.22 : 1;
}

/** On-screen control button diameter in game pixels. */
export function getTouchButtonSize(): number {
  return isTouchPreferred() ? 148 : 118;
}

/** Bottom/side padding for on-screen controls in game pixels. */
export function getTouchPad(): number {
  return isTouchPreferred() ? 44 : 32;
}
