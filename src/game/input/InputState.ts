export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  lightAttack: boolean;
  heavyAttack: boolean;
  block: boolean;
}

export function emptyInput(): InputState {
  return {
    left: false,
    right: false,
    jump: false,
    lightAttack: false,
    heavyAttack: false,
    block: false,
  };
}
