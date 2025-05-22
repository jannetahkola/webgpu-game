import type { Prefab } from './prefabs/prefab.ts';
import Scene from './scene.ts';
import ModelComponent from '../ecs/components/modelComponent.ts';
import type { GltfManager } from '../resources/gltf.ts';
import ChildComponent from '../ecs/components/childComponent.ts';
import TransformComponent from '../ecs/components/transformComponent.ts';
import { vec3 } from 'wgpu-matrix';
import MeshComponent from '../ecs/components/meshComponent.ts';
import MaterialComponent from '../ecs/components/materialComponent.ts';
import ParentComponent from '../ecs/components/parentComponent.ts';
import InputSystem from '../ecs/systems/inputSystem.ts';
import PlayerControllerSystem from '../ecs/systems/playerControllerSystem.ts';
import TransformSystem from '../ecs/systems/transformSystem.ts';
import CameraSystem from '../ecs/systems/cameraSystem.ts';
import type { GameInput } from '../input/actions.ts';
import CameraComponent from '../ecs/components/cameraComponent.ts';
import FirstPersonCamera from '../cameras/firstPersonCamera.ts';

export default class PrefabSceneLoader {
  readonly #gltfManager: GltfManager;

  constructor(gltfManager: GltfManager) {
    this.#gltfManager = gltfManager;
  }

  async load(device: GPUDevice, prefab: Prefab, input: GameInput) {
    console.log('Loading prefab', prefab);

    const scene = new Scene(prefab.name);

    scene.em.deserialize(prefab.em);

    await this.#initResources(scene, device);

    this.#initModels(scene);
    this.#initCameras(scene);

    scene.systems.push(
      new InputSystem(input),
      new PlayerControllerSystem(),
      new TransformSystem(device),
      new CameraSystem(device)
    );

    return scene;
  }

  async #initResources(scene: Scene, device: GPUDevice) {
    const modelComponents = scene.em.getEntitiesWith([ModelComponent]);
    const refs = modelComponents.map(
      (c) => scene.em.getComponent(c, ModelComponent).ref
    );
    await this.#gltfManager.loadGltf(device, refs);
  }

  #initModels(scene: Scene) {
    for (const e of scene.em.getEntitiesWith([ModelComponent])) {
      const modelComponent = scene.em.getComponent(e, ModelComponent);
      const { entity: parentEntity } = scene.em.newEntity().addComponent(
        new ChildComponent(),
        new TransformComponent({
          transform: { position: vec3.fromValues(0, 0, -2) },
        }),
        modelComponent
      );

      this.#gltfManager.get(modelComponent.ref).meshes.forEach((mesh) => {
        const { entity: childEntity } = scene.em
          .newEntity()
          .addComponent(
            new MeshComponent(mesh.ref),
            new MaterialComponent(mesh.materialRef),
            new TransformComponent(),
            new ParentComponent({ parent: parentEntity })
          );
        scene.em
          .getComponent(parentEntity, ChildComponent)
          .children.push(childEntity);
      });
    }
  }

  #initCameras(scene: Scene) {
    for (const e of scene.em.getEntitiesWith([CameraComponent])) {
      const cameraComponent = scene.em.getComponent(e, CameraComponent);
      if (cameraComponent.cameraType === 'FirstPersonCamera') {
        cameraComponent.camera = new FirstPersonCamera();
      } else {
        throw new Error(
          'Camera type not supported: ' + cameraComponent.cameraType
        );
      }
    }
  }
}
