import { quat, vec3 } from 'wgpu-matrix';
import { Player, type EntityManager } from '../entities/entityManager';
import PlayerControllerComponent from '../components/playerControllerComponent.ts';
import TransformComponent from '../components/transformComponent.ts';
import type System from './system.ts';

export default class PlayerControllerSystem implements System {
  readonly #maxPitch = Math.PI / 2 - 0.01;

  readonly #worldForward = vec3.fromValues(0, 0, -1);
  readonly #worldUp = vec3.fromValues(0, 1, 0);
  readonly #worldRight = vec3.fromValues(1, 0, 0);

  readonly #localForward = vec3.create();
  readonly #localRight = vec3.create();
  readonly #moveDir = vec3.create();
  readonly #yawQuat = quat.create();
  readonly #pitchQuat = quat.create();

  update(dt: number, em: EntityManager) {
    const player = em.getSingletonEntity(Player);
    const controller = em.getComponent(player, PlayerControllerComponent);
    const transform = em.getComponent(player, TransformComponent).transform;

    const worldForward = this.#worldForward;
    const worldUp = this.#worldUp;
    const worldRight = this.#worldRight;

    const localForward = this.#localForward;
    const localRight = this.#localRight;
    const moveDir = this.#moveDir;

    // -- Rotation

    controller.yaw -= controller.lookDelta[0] * dt * controller.rotationSpeed;
    controller.pitch -= controller.lookDelta[1] * dt * controller.rotationSpeed;
    controller.pitch = Math.max(
      -this.#maxPitch,
      Math.min(this.#maxPitch, controller.pitch)
    );

    quat.fromAxisAngle(worldUp, controller.yaw, this.#yawQuat);
    quat.fromAxisAngle(worldRight, controller.pitch, this.#pitchQuat);

    quat.multiply(this.#yawQuat, this.#pitchQuat, transform.rotation); // don't accumulate
    quat.normalize(transform.rotation, transform.rotation);

    // -- Movement

    vec3.transformQuat(worldForward, this.#yawQuat, localForward); // ignore pitch; restrict to xz plane
    vec3.transformQuat(worldRight, this.#yawQuat, localRight);

    vec3.zero(moveDir);
    vec3.addScaled(moveDir, localForward, controller.moveDir[2], moveDir);
    vec3.addScaled(moveDir, worldUp, controller.moveDir[1], moveDir);
    vec3.addScaled(moveDir, localRight, controller.moveDir[0], moveDir);

    if (vec3.lengthSq(moveDir) > 0) {
      vec3.normalize(moveDir, moveDir);
      vec3.addScaled(
        transform.position,
        moveDir,
        dt * controller.moveSpeed,
        transform.position
      );
    }
  }
}
