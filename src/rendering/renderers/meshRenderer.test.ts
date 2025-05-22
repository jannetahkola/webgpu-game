import MeshRenderer from './meshRenderer';
import type { RenderContext } from './renderContext.ts';
import { WebGPUStubs } from '../../../tests/stubs.ts';
import { EntityManager, Player } from '../../ecs/entities/entityManager.ts';
import CameraComponent from '../../ecs/components/cameraComponent.ts';
import FirstPersonCamera from '../../cameras/firstPersonCamera.ts';
import MeshComponent from '../../ecs/components/meshComponent.ts';
import MaterialComponent from '../../ecs/components/materialComponent.ts';
import TransformComponent from '../../ecs/components/transformComponent.ts';
import type { GltfManager } from '../../resources/gltf.ts';

describe('MeshRenderer', () => {
  it('creates resources and draws', () => {
    const em = new EntityManager();

    const cameraComponent = new CameraComponent({
      cameraType: 'FirstPersonCamera',
      camera: new FirstPersonCamera(),
    });
    em.newSingletonEntity(Player).addComponent(cameraComponent);

    const transformComponent = new TransformComponent();
    em.newEntity().addComponent(
      new MeshComponent(''),
      new MaterialComponent(''),
      transformComponent
    );

    vi.spyOn(cameraComponent, 'getViewProjectionBuffer').mockReturnValue(
      {} as GPUBuffer
    );
    vi.spyOn(transformComponent, 'getModelBuffer').mockReturnValue(
      {} as GPUBuffer
    );

    const gltfManager = {
      getMesh: vi.fn(() => ({
        vertexBuffer: {},
      })),
      getMaterial: vi.fn(() => ({
        buffer: vi.fn(),
        texture: { createView: vi.fn() },
      })),
    } as unknown as GltfManager;
    const { device, texture, pass } = WebGPUStubs.createDevice();
    const context = {
      device,
      pass,
      txScene: texture,
      txDepth: texture,
      em,
      gltfManager,
    } as unknown as RenderContext;
    const renderer = new MeshRenderer();

    renderer.render(context);
    renderer.render(context);

    expect(device.createSampler).toHaveBeenCalledOnce();
    expect(device.createBindGroup).toHaveBeenCalledTimes(4);
    expect(pass.drawIndexed).toHaveBeenCalledTimes(2);

    // todo maybe validate arguments passed to GPU resources
  });
});
