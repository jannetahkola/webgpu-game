import type Scene from './scene.ts';
import type { GltfManager } from '../resources/gltf.ts';
import { EntityManager } from '../ecs/entities/entityManager.ts';
import TransformComponent from '../ecs/components/transformComponent.ts';
import { Player } from '../ecs/entities/singletonEntityTag.ts';
import CameraComponent from '../ecs/components/cameraComponent.ts';
import FirstPersonCamera from '../cameras/first-person-camera.ts';
import PlayerControllerComponent from '../ecs/components/playerControllerComponent.ts';
import PlayerControllerSystem from '../ecs/systems/playerControllerSystem.ts';
import type System from '../ecs/systems/system.ts';
import CameraSystem from '../ecs/systems/cameraSystem.ts';
import MeshComponent from '../ecs/components/meshComponent.ts';
import MaterialComponent from '../ecs/components/materialComponent.ts';
import TransformSystem from '../ecs/systems/transformSystem.ts';
import InputSystem from '../ecs/systems/inputSystem.ts';
import type { GameInput } from '../input/actions.ts';
import { vec3 } from 'wgpu-matrix';

export default class MainScene implements Scene {
  readonly em = new EntityManager();
  readonly #systems: System[] = [];
  readonly #gltfManager: GltfManager;

  constructor(gltfManager: GltfManager) {
    this.#gltfManager = gltfManager;
  }

  update(dt: number) {
    this.#systems.forEach((system) => system.update(dt, this.em));
  }

  async load(device: GPUDevice, input: GameInput) {
    this.em.createSingletonEntity(Player).addComponent(
      new PlayerControllerComponent(),
      new CameraComponent(new FirstPersonCamera()),
      new TransformComponent({
        transform: { position: vec3.fromValues(0, 0, 1) },
      })
    );

    const cube = this.#gltfManager.get('./assets/gltf/rubik_cube.glb');
    cube.meshes.forEach((mesh) => {
      this.em
        .createEntity()
        .addComponent(
          new MeshComponent(mesh.ref),
          new MaterialComponent(mesh.materialRef),
          new TransformComponent()
        );
    });

    this.#systems.push(
      new InputSystem(input),
      new PlayerControllerSystem(),
      new TransformSystem(device),
      new CameraSystem(device)
    );
  }
}
