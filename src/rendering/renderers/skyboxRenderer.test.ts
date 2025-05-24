import { WebGPUStubs } from '../../../tests/stubs.ts';
import SkyboxRenderer from './skyboxRenderer.ts';
import type { RenderContext } from './renderContext.ts';
import {
  EntityManager,
  Player,
  Skybox,
} from '../../ecs/entities/entityManager.ts';
import ResourceManager from '../../resources/resourceManager.ts';
import CameraComponent from '../../ecs/components/cameraComponent.ts';
import FirstPersonCamera from '../../cameras/firstPersonCamera.ts';
import SkyboxComponent from '../../ecs/components/skyboxComponent.ts';
import { CubeMapComponent } from '../../ecs/components/cubeMapComponent.ts';

describe('SkyboxRenderer', () => {
  it('creates resources and draws', () => {
    const { device, pass, texture } = WebGPUStubs.createDevice();
    const em = new EntityManager();

    em.newSingletonEntity(Player).addComponent(
      new CameraComponent({
        cameraType: 'FirstPersonCamera',
        camera: new FirstPersonCamera(),
      })
    );

    const skyboxComponent = new SkyboxComponent();
    em.newSingletonEntity(Skybox).addComponent(
      skyboxComponent,
      new CubeMapComponent({ ref: '' })
    );

    const resourceManager = {
      getCubeMapTexture: vi.fn(),
    } as unknown as ResourceManager;
    const renderer = new SkyboxRenderer();
    const context: RenderContext = {
      device,
      pass,
      txScene: texture,
      txDepth: texture,
      sampleCount: 1,
      em,
      resourceManager,
    };

    vi.spyOn(skyboxComponent, 'getInverseViewProjectionBuffer').mockReturnValue(
      {} as GPUBuffer
    );

    renderer.render(context);
    renderer.render(context);

    expect(device.createBindGroup).toHaveBeenCalledOnce();
    expect(pass.draw).toHaveBeenCalledTimes(2);
  });
});
