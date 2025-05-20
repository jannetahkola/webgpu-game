import PlayerControllerSystem from './playerControllerSystem';
import { EntityManager } from '../entities/entityManager.ts';
import { Player } from '../entities/singletonEntityTag.ts';
import PlayerControllerComponent from '../components/playerControllerComponent.ts';
import TransformComponent from '../components/transformComponent.ts';

describe('PlayerControllerSystem', () => {
  it('clamps pitch', () => {
    const system = new PlayerControllerSystem();
    const em = new EntityManager();
    const controller = new PlayerControllerComponent();
    const transform = new TransformComponent();
    em.createSingletonEntity(Player).addComponent(controller, transform);

    controller.lookDelta[1] = 1000;
    system.update(1, em);

    expect(controller.pitch).toBeLessThanOrEqual(Math.PI / 2 - 0.01);

    controller.lookDelta[1] = -1000;
    system.update(1, em);

    expect(controller.pitch).toBeGreaterThanOrEqual(-(Math.PI / 2 - 0.01));
  });

  it('moves on XZ plane regardless of pitch', () => {
    const system = new PlayerControllerSystem();
    const em = new EntityManager();
    const controller = new PlayerControllerComponent();
    const transform = new TransformComponent();
    em.createSingletonEntity(Player).addComponent(controller, transform);

    // look up and move forward
    controller.lookDelta[1] = 100;
    controller.moveDir[2] = -1;
    system.update(1, em);

    const position = transform.transform.position;
    expect(position[1]).toBe(0);
  });
});
