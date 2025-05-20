import { Input } from './input.ts';

const Actions = {
  moveForward: 'moveForward',
  moveBackward: 'moveBackward',
  moveLeft: 'moveLeft',
  moveRight: 'moveRight',
  descend: 'descend',
  ascend: 'ascend',
} as const;

type Action = (typeof Actions)[keyof typeof Actions];

const defaultBindings = () => {
  return {
    moveForward: 'KeyW',
    moveBackward: 'KeyS',
    moveLeft: 'KeyA',
    moveRight: 'KeyD',
    descend: 'ShiftLeft',
    ascend: 'Space',
  } satisfies Record<Action, string>;
};

class GameInput extends Input<Action> {}

export type { Action };
export { GameInput, Actions, defaultBindings };
