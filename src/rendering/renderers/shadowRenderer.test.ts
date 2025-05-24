import { EntityManager, Lighting } from '../../ecs/entities/entityManager.ts';
import ShadowComponent from '../../ecs/components/shadowComponent.ts';
import ShadowRenderer from './shadowRenderer.ts';
import { WebGPUStubs } from '../../../tests/stubs.ts';
import ResourceManager from '../../resources/resourceManager.ts';
import MeshComponent from '../../ecs/components/meshComponent.ts';
import TransformComponent from '../../ecs/components/transformComponent.ts';

describe('ShadowRenderer', () => {
  it('creates resources and draws', () => {
    const { device, encoder, pass } = WebGPUStubs.createDevice();

    const em = new EntityManager();

    const shadowComponent = new ShadowComponent({ shadowMapSize: 1024 });
    em.newSingletonEntity(Lighting).addComponent(shadowComponent);

    const transformComponent = new TransformComponent();
    em.newEntity().addComponent(new MeshComponent(''), transformComponent);

    const renderer = new ShadowRenderer();

    const resourceManager = {
      getModelMesh: vi.fn(() => ({
        vertexBuffer: {},
      })),
    } as unknown as ResourceManager;

    vi.spyOn(transformComponent, 'getModelBuffer').mockReturnValue(
      {} as GPUBuffer
    );
    vi.spyOn(shadowComponent, 'getViewProjectionBuffer').mockReturnValue(
      {} as GPUBuffer
    );
    vi.spyOn(shadowComponent, 'getDepthTexture').mockReturnValue({
      createView: vi.fn(),
    } as GPUTexture);

    renderer.render(device, encoder, em, resourceManager);
    renderer.render(device, encoder, em, resourceManager);

    expect(device.createBindGroup).toHaveBeenCalledTimes(2);
    expect(pass.drawIndexed).toHaveBeenCalledTimes(2);

    // todo maybe validate arguments passed to GPU resources
  });
});
