import type { Prefab } from './prefabs/prefab.ts';
import Scene from './scene.ts';
import ModelComponent from '../ecs/components/modelComponent.ts';
import ChildComponent from '../ecs/components/childComponent.ts';
import TransformComponent from '../ecs/components/transformComponent.ts';
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
import LightingSystem from '../ecs/systems/lightingSystem.ts';
import ShadowSystem from '../ecs/systems/shadowSystem.ts';
import { CubeMapComponent } from '../ecs/components/cubeMapComponent.ts';
import type ResourceManager from '../resources/resourceManager.ts';
import SkyboxSystem from '../ecs/systems/skyboxSystem.ts';
import ColliderWireframeSystem from '../ecs/systems/colliderWireframeSystem.ts';
import DiagnosticsResource from '../ecs/resources/diagnosticsResource.ts';
import MeshWireframeSystem from '../ecs/systems/meshWireframeSystem.ts';
import ColliderComponent from '../ecs/components/colliderComponent.ts';
import type { MeshCollider } from '../physics/colliders.ts';
import CssLog from '../logging/logging.ts';
import PhysicsSystem from '../ecs/systems/physicsSystem.ts';

export default class PrefabSceneLoader {
  readonly #resourceManager: ResourceManager;

  constructor(resourceManager: ResourceManager) {
    this.#resourceManager = resourceManager;
  }

  async load(device: GPUDevice, prefab: Prefab, input: GameInput) {
    const start = performance.now();
    console.debug('loading prefab', prefab);

    const scene = new Scene(prefab.name);

    scene.em.deserialize(prefab.em);
    scene.em.newResource(new DiagnosticsResource()); // todo proper typing for ecs resources

    await this.#initResourceAssets(scene, device);
    this.#initModels(scene);
    this.#initCameras(scene);

    scene.systems.push(
      new InputSystem(input),
      new PlayerControllerSystem(),
      new PhysicsSystem(this.#resourceManager),
      new TransformSystem(device),
      new CameraSystem(device),
      new SkyboxSystem(device),
      new LightingSystem(device),
      new ShadowSystem(device),
      new MeshWireframeSystem(),
      new ColliderWireframeSystem(device)
    );

    console.log(...CssLog.successTimed('prefab loaded', start, prefab.name));

    return scene;
  }

  async #initResourceAssets(scene: Scene, device: GPUDevice) {
    {
      const modelComponents = scene.em.getEntitiesWith([ModelComponent]);
      const refs = modelComponents.map(
        (c) => scene.em.getComponent(c, ModelComponent).ref
      );
      await this.#resourceManager.loadModels(device, refs);
    }
    {
      const colliderComponents = scene.em.getEntitiesWith([ColliderComponent]);
      const refs = colliderComponents
        .map((c) => scene.em.getComponent(c, ColliderComponent))
        .filter((c) => c.collider.type === 'mesh')
        .map((c) => (c.collider as MeshCollider).ref);
      await this.#resourceManager.loadModels(device, refs);
    }
    {
      const cubeMapComponents = scene.em.getEntitiesWith([CubeMapComponent]);
      const refs = cubeMapComponents.map(
        (c) => scene.em.getComponent(c, CubeMapComponent).ref
      );
      await this.#resourceManager.loadCubeMaps(device, refs);
    }
  }

  #initModels(scene: Scene) {
    for (const e of scene.em.getEntitiesWith([ModelComponent])) {
      const modelComponent = scene.em.getComponent(e, ModelComponent);
      scene.em.addComponent(e, new ChildComponent());
      this.#resourceManager
        .getModel(modelComponent.ref)
        .meshes.forEach((mesh) => {
          const { entity: childEntity } = scene.em
            .newEntity()
            .addComponent(
              new MeshComponent(mesh.ref),
              new MaterialComponent(mesh.materialRef),
              new TransformComponent(),
              new ParentComponent({ parent: e })
            );
          scene.em.getComponent(e, ChildComponent).children.push(childEntity);
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
