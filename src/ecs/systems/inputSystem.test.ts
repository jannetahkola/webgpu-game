import InputSystem from './inputSystem';
import { type Action, Actions, type GameInput } from '../../input/actions.ts';
import { EntityManager, Player } from '../entities/entityManager.ts';
import PlayerControllerComponent from '../components/playerControllerComponent.ts';

describe('InputSystem', () => {
  it('updates controller', () => {
    const input = {
      getPointerDeltaX: vi.fn(),
      getPointerDeltaY: vi.fn(),
      isActive: vi.fn(),
    } as unknown as GameInput;
    const system = new InputSystem(input);
    const em = new EntityManager();
    const controller = new PlayerControllerComponent();
    em.newSingletonEntity(Player).addComponent(controller);

    vi.spyOn(input, 'getPointerDeltaX').mockReturnValue(1);
    vi.spyOn(input, 'getPointerDeltaY').mockReturnValue(2);
    vi.spyOn(input, 'isActive').mockImplementation(
      (action: Action) => action === Actions.moveForward
    );

    system.update(0, em);

    expect(controller.lookDelta).toEqual(new Float32Array([1, 2]));
    expect(controller.moveDir).toEqual(new Float32Array([0, 0, 1]));

    vi.spyOn(input, 'getPointerDeltaX').mockReturnValue(3);
    vi.spyOn(input, 'getPointerDeltaY').mockReturnValue(4);

    system.update(0, em);

    expect(controller.lookDelta).toEqual(new Float32Array([3, 4]));

    vi.spyOn(input, 'isActive').mockImplementation(
      (action: Action) => action === Actions.moveBackward
    );

    system.update(0, em);

    expect(controller.moveDir).toEqual(new Float32Array([0, 0, -1]));

    vi.spyOn(input, 'isActive').mockImplementation(
      (action: Action) => action === Actions.moveLeft
    );

    system.update(0, em);

    expect(controller.moveDir).toEqual(new Float32Array([-1, 0, 0]));

    vi.spyOn(input, 'isActive').mockImplementation(
      (action: Action) => action === Actions.moveRight
    );

    system.update(0, em);

    expect(controller.moveDir).toEqual(new Float32Array([1, 0, 0]));
  });
});
