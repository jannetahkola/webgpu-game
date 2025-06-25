import {
  type EntityManager,
  EntityQuery,
  Player,
} from '../entities/entityManager.ts';
import type System from './system.ts';
import ColliderComponent from '../components/colliderComponent.ts';
import TransformComponent from '../components/transformComponent.ts';
import type ResourceManager from '../../resources/resourceManager.ts';
import { vec3 } from 'wgpu-matrix';
import RigidBodyComponent from '../components/rigidBodyComponent.ts';
import PlayerControllerComponent from '../components/playerControllerComponent.ts';
import { type Ray, Raycast } from '../../physics/raycast.ts';
import type { MeshCollider } from '../../physics/colliders.ts';
import type { Transform } from '../../rendering/transform.ts';

export default class PhysicsSystem implements System {
  // earth's gravity in m/s^2
  readonly #gravity = [0, -9.8, 0];
  readonly #gravityOnAscend = vec3.scale(this.#gravity, 0.7);

  readonly #query = new EntityQuery([ColliderComponent]);
  readonly #resourceManager: ResourceManager;

  readonly #rayDir = vec3.create(0, -1, 0);
  readonly #footPos = vec3.create();
  readonly #rayOrigin = vec3.create();
  readonly #slideDir = vec3.create();

  constructor(resourceManager: ResourceManager) {
    this.#resourceManager = resourceManager;
  }

  update(dt: number, em: EntityManager): void {
    const player = em.getSingletonEntity(Player);
    const playerTransformComponent = em.getComponent(
      player,
      TransformComponent
    );
    const playerTransform = playerTransformComponent.transform;
    const playerRigidBody = em.getComponent(player, RigidBodyComponent);
    const playerController = em.getComponent(player, PlayerControllerComponent);
    const flyMode = playerController.flyModeEnabled;

    this.#updateVelocity(playerController, playerRigidBody);

    playerRigidBody.grounded = false; // force rerun ground checks

    if (!flyMode) {
      const colliderEntities = this.#query.execute(em);
      for (const e of colliderEntities) {
        if (e === player) continue;

        const collider = em.getComponent(e, ColliderComponent).collider;

        switch (collider.type) {
          case 'box':
            break;
          case 'mesh': {
            this.#updateGrounded(
              dt,
              collider,
              playerTransform,
              playerRigidBody,
              playerController
            );
            break;
          }
        }
      }
    }

    if (playerRigidBody.grounded && playerController.jumpRequested) {
      playerRigidBody.velocity[1] = 2.1; // tweak for jump height
      playerRigidBody.grounded = false;
    }

    if (!playerRigidBody.grounded && !flyMode) {
      const gravity =
        playerRigidBody.velocity[1] > 0 ? this.#gravityOnAscend : this.#gravity;
      // apply gravity
      vec3.addScaled(
        playerRigidBody.velocity,
        gravity,
        dt,
        playerRigidBody.velocity
      );
    }

    vec3.addScaled(
      playerTransform.position,
      playerRigidBody.velocity,
      dt,
      playerTransform.position
    );

    playerController.jumpRequested = false; // todo maybe reset in same place where it is set
    playerTransformComponent.dirty = true; // todo use setters where this is set
  }

  #updateVelocity(
    controller: PlayerControllerComponent,
    rigidBody: RigidBodyComponent
  ) {
    const flyMode = controller.flyModeEnabled;

    if (vec3.lengthSq(controller.moveDir) > 0) {
      const moveDir = controller.moveDir;
      vec3.normalize(moveDir, moveDir);

      const moveSpeed = controller.moveSpeed;
      rigidBody.velocity[0] = moveDir[0] * moveSpeed;
      rigidBody.velocity[2] = moveDir[2] * moveSpeed;

      if (flyMode) {
        rigidBody.velocity[1] = moveDir[1] * moveSpeed;
      }
    } else {
      rigidBody.velocity[0] = 0;
      rigidBody.velocity[2] = 0;
      if (flyMode) rigidBody.velocity[1] = 0; // reset each frame
    }
  }

  #computeGroundSnapDistance(dt: number, rigidBody: RigidBodyComponent) {
    let snapDistMax = 0.2;

    if (rigidBody.velocity[1] < -0.1) {
      const fallSpeed = Math.abs(rigidBody.velocity[1]);
      // scale snap range up when falling faster
      snapDistMax = Math.min(0.2, 0.05 + fallSpeed * dt * 1.5);
    }

    return snapDistMax;
  }

  #updateGrounded(
    dt: number,
    collider: MeshCollider,
    playerTransform: Transform,
    playerRigidBody: RigidBodyComponent,
    playerController: PlayerControllerComponent
  ) {
    const meshModel = this.#resourceManager.getModel(collider.ref);

    const { position } = playerTransform;

    // slightly above the feet
    const rayOffsetY = 0.1;
    // snap when at most halfway into the above offset
    const snapOffsetY = 0.05;

    const footPos = vec3.add(position, [0, -1.0, 0], this.#footPos); // feet at y = 0 (because player/fpsCamera at y = 1)
    const rayOrigin = vec3.add(
      this.#footPos,
      [0, rayOffsetY, 0],
      this.#rayOrigin
    ); // just above feet
    const ray: Ray = {
      origin: rayOrigin,
      direction: this.#rayDir,
    };

    const isAscending = playerRigidBody.velocity[1] > 0;

    for (const mesh of meshModel.meshes) {
      if (playerRigidBody.grounded) break; // exit early

      const hit = Raycast.intersectsMesh(
        ray,
        mesh.vertexArray,
        mesh.indexArray
      );

      const snapIfAscending = hit && hit.t < snapOffsetY;

      if (
        hit &&
        hit.t <= this.#computeGroundSnapDistance(dt, playerRigidBody) &&
        (!isAscending || snapIfAscending)
      ) {
        const dot = Math.max(-1, Math.min(1, vec3.dot(hit.normal, [0, 1, 0])));
        const slopeAngle = Math.acos(dot);
        const maxSlopeAngle = Math.PI / 4; // 45 deg

        if (slopeAngle <= maxSlopeAngle) {
          // walkable slope
          const velocity = playerRigidBody.velocity;
          vec3.subtract(
            velocity,
            vec3.scale(hit.normal, vec3.dot(velocity, hit.normal)),
            velocity
          );

          footPos[1] = ray.origin[1] - hit.t;
          position[1] = footPos[1] + 1.0;

          playerRigidBody.velocity[1] = 0;
          playerRigidBody.grounded = true;
        } else {
          if (playerRigidBody.velocity[1] < -0.1) {
            // falling down -> slide
            const gravityDir = vec3.normalize(this.#gravity);
            const slideDir = vec3.cross(
              vec3.cross(hit.normal, gravityDir),
              hit.normal,
              this.#slideDir
            );
            vec3.normalize(slideDir, slideDir);
            vec3.scale(slideDir, 3.0, slideDir);
            vec3.copy(slideDir, playerRigidBody.velocity);
          } else {
            // on steep wall, reset velocity
            // vec3.zero(playerRigidBody.velocity);

            // stop horizontal movement
            playerRigidBody.velocity[0] = 0;
            playerRigidBody.velocity[2] = 0;

            // clamp gravity to prevent push-through
            if (playerRigidBody.velocity[1] < -1) {
              playerRigidBody.velocity[1] = -1;
            }

            // break;
          }
        }
      }
    }
  }
}
