import type System from './system';
import { type EntityManager, Player } from '../entities/entityManager.ts';
import PlayerControllerComponent from '../components/playerControllerComponent.ts';
import { Actions, type GameInput } from '../../input/actions.ts';

export default class InputSystem implements System {
  readonly #input: GameInput;

  constructor(input: GameInput) {
    this.#input = input;
  }

  update(_dt: number, em: EntityManager): void {
    const controller = em.getComponent(
      em.getSingletonEntity(Player),
      PlayerControllerComponent
    );

    if (this.#input.isDoublePressed(Actions.ascend)) {
      controller.flyModeEnabled = !controller.flyModeEnabled;
      console.log('flyModeEnabled=', controller.flyModeEnabled);
      // todo continue
    }

    controller.lookDelta[0] = this.#input.getPointerDeltaX();
    controller.lookDelta[1] = this.#input.getPointerDeltaY();

    const input = this.#input;

    controller.moveDir.fill(0);
    if (input.isPressed(Actions.moveForward)) {
      controller.moveDir[2] += 1;
    }
    if (input.isPressed(Actions.moveBackward)) {
      controller.moveDir[2] += -1;
    }
    if (input.isPressed(Actions.moveLeft)) {
      controller.moveDir[0] += -1;
    }
    if (input.isPressed(Actions.moveRight)) {
      controller.moveDir[0] += 1;
    }

    if (controller.flyModeEnabled) {
      if (input.isPressed(Actions.ascend)) {
        controller.moveDir[1] += 1;
      }
      if (input.isPressed(Actions.descend)) {
        controller.moveDir[1] += -1;
      }
    }
  }
}
