import MeshRenderer from './meshRenderer';
import type { RenderContext } from './renderContext.ts';
import { WebGPUStubs } from '../../../tests/stubs.ts';
import {
  EntityManager,
  Lighting,
  Player,
} from '../../ecs/entities/entityManager.ts';
import CameraComponent from '../../ecs/components/cameraComponent.ts';
import FirstPersonCamera from '../../cameras/firstPersonCamera.ts';
import MeshComponent from '../../ecs/components/meshComponent.ts';
import MaterialComponent from '../../ecs/components/materialComponent.ts';
import TransformComponent from '../../ecs/components/transformComponent.ts';
import LightingComponent from '../../ecs/components/lightingComponent.ts';
import ShadowComponent from '../../ecs/components/shadowComponent.ts';
import type ResourceManager from '../../resources/resourceManager.ts';

describe('MeshRenderer', () => {
  it('creates resources and draws', () => {
    const em = new EntityManager();

    const cameraComponent = new CameraComponent({
      cameraType: 'FirstPersonCamera',
      camera: new FirstPersonCamera(),
    });
    em.newSingletonEntity(Player).addComponent(cameraComponent);

    const lightingComponent = new LightingComponent();
    const shadowComponent = new ShadowComponent({ shadowMapSize: 1024 });
    em.newSingletonEntity(Lighting).addComponent(
      lightingComponent,
      shadowComponent
    );

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
    vi.spyOn(transformComponent, 'getNormalBuffer').mockReturnValue(
      {} as GPUBuffer
    );
    vi.spyOn(lightingComponent, 'getBuffer').mockReturnValue({} as GPUBuffer);
    vi.spyOn(shadowComponent, 'getViewProjectionBuffer').mockReturnValue(
      {} as GPUBuffer
    );
    vi.spyOn(shadowComponent, 'getBuffer').mockReturnValue({} as GPUBuffer);
    vi.spyOn(shadowComponent, 'getDepthTexture').mockReturnValue({
      createView: vi.fn(),
    } as GPUTexture);
    vi.spyOn(shadowComponent, 'getDepthTextureSampler').mockReturnValue(
      {} as GPUSampler
    );

    const resourceManager = {
      getModelMesh: vi.fn(() => ({
        vertexBuffer: {},
      })),
      getModelMaterial: vi.fn(() => ({
        buffer: vi.fn(),
        texture: { createView: vi.fn() },
      })),
    } as unknown as ResourceManager;
    const { device, texture, pass } = WebGPUStubs.createDevice();
    const context: RenderContext = {
      device,
      pass,
      txScene: texture,
      txDepth: texture,
      em,
      resourceManager,
      sampleCount: 1,
    };
    const renderer = new MeshRenderer();

    renderer.render(context);
    renderer.render(context);

    expect(device.createSampler).toHaveBeenCalledTimes(1); // material sampler
    expect(device.createBindGroup).toHaveBeenCalledTimes(8); // 2x mesh, 2x material, 2x lighting, 2x shadow
    expect(pass.drawIndexed).toHaveBeenCalledTimes(2); // 2 renders

    // todo maybe validate arguments passed to GPU resources
  });
});
