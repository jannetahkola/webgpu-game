import { WebGPUStubs } from '../../../tests/stubs.ts';
import MainRenderer from './mainRenderer.ts';
import type { Viewport } from '../../viewport/viewport.ts';
import RendererFactory from './rendererFactory.ts';
import PostProcessRenderer from './postprocessRenderer.ts';
import { EntityManager } from '../../ecs/entities/entityManager.ts';
import MeshRenderer from './meshRenderer.ts';
import ResourceManager from '../../resources/resourceManager.ts';
import ShadowRenderer from './shadowRenderer.ts';
import SkyboxRenderer from './skyboxRenderer.ts';
import MeshWireframeRenderer from './meshWireframeRenderer.ts';
import ColliderWireframeRenderer from './colliderWireframeRenderer.ts';

describe('MainRenderer', () => {
  let meshRendererStub: MeshRenderer;
  let postProcessRendererStub: PostProcessRenderer;
  let shadowRendererStub: ShadowRenderer;
  let skyboxRendererStub: SkyboxRenderer;
  let meshWireframeRendererStub: MeshWireframeRenderer;
  let colliderWireframeRendererStub: ColliderWireframeRenderer;

  let viewport: Viewport;
  let rendererFactory: RendererFactory;

  let em: EntityManager;
  let resourceManager: ResourceManager;

  beforeEach(() => {
    viewport = {
      getResolution: () => ({ w: 800, h: 600 }),
      getAspectScale: () => ({ x: 1, y: 1 }),
      getContext: () => ({
        getCurrentTexture: () => ({
          createView: vi.fn(),
        }),
      }),
    } as unknown as Viewport;

    meshRendererStub = {
      render: vi.fn(),
    } as unknown as MeshRenderer;

    postProcessRendererStub = {
      render: vi.fn(),
      toCanvas: vi.fn(),
      onAspectScaleChange: vi.fn(),
      onTexturesDestroyed: vi.fn(),
    };

    shadowRendererStub = {
      render: vi.fn(),
    } as unknown as ShadowRenderer;

    skyboxRendererStub = {
      render: vi.fn(),
    } as unknown as SkyboxRenderer;

    meshWireframeRendererStub = {
      render: vi.fn(),
    } as unknown as MeshWireframeRenderer;

    colliderWireframeRendererStub = {
      render: vi.fn(),
    } as unknown as ColliderWireframeRenderer;

    rendererFactory = {
      create: vi.fn(
        <T>(Ctor: new (...args: unknown[]) => T, ..._args: unknown[]): T => {
          if (Ctor === MeshRenderer) {
            return meshRendererStub as T;
          }
          if (Ctor === PostProcessRenderer) {
            return postProcessRendererStub as T;
          }
          if (Ctor === ShadowRenderer) {
            return shadowRendererStub as T;
          }
          if (Ctor === SkyboxRenderer) {
            return skyboxRendererStub as T;
          }
          if (Ctor === MeshWireframeRenderer) {
            return meshWireframeRendererStub as T;
          }
          if (Ctor === ColliderWireframeRenderer) {
            return colliderWireframeRendererStub as T;
          }
          throw new Error('Unknown renderer: ' + Ctor.name);
        }
      ),
    };

    em = new EntityManager();

    resourceManager = {
      getModel: vi.fn(),
      getModelMesh: vi.fn(),
      getModelMaterial: vi.fn(),
      getCubeMapTexture: vi.fn(),
    } as unknown as ResourceManager;
  });

  it('creates textures and submits frame', () => {
    const { device } = WebGPUStubs.createDevice();
    const renderer = new MainRenderer({
      device,
      viewport,
      rendererFactory,
      resourceManager,
    });

    renderer.render(em);

    expect(device.createTexture).toHaveBeenCalledTimes(2); // scene, depth
    expect(device.createCommandEncoder).toHaveBeenCalledOnce();
    expect(meshRendererStub.render).toHaveBeenCalledOnce();
    expect(postProcessRendererStub.render).toHaveBeenCalledOnce();
    expect(device.queue.submit).toHaveBeenCalledOnce();
  });

  it('creates textures and submits frame when multisampling enabled', () => {
    const { device } = WebGPUStubs.createDevice();
    const renderer = new MainRenderer({
      device,
      viewport,
      rendererFactory,
      resourceManager,
      options: { multisampling: 4 },
    });

    renderer.render(em);

    expect(device.createTexture).toHaveBeenCalledTimes(3); // scene, depth, resolve
    expect(device.createCommandEncoder).toHaveBeenCalledOnce();
    expect(meshRendererStub.render).toHaveBeenCalledOnce();
    expect(postProcessRendererStub.render).toHaveBeenCalledOnce();
    expect(device.queue.submit).toHaveBeenCalledOnce();
  });

  it('recreates textures and submits frame when resolution changes', () => {
    const { device, texture } = WebGPUStubs.createDevice();
    const renderer = new MainRenderer({
      device,
      viewport,
      rendererFactory,
      resourceManager,
    });

    renderer.render(em);
    renderer.queueResolutionChange();
    renderer.render(em);
    renderer.render(em);

    expect(device.createTexture).toHaveBeenCalledTimes(4); // 2x scene, 2x depth
    expect(device.createCommandEncoder).toHaveBeenCalledTimes(3);
    expect(meshRendererStub.render).toHaveBeenCalledTimes(3);
    expect(postProcessRendererStub.render).toHaveBeenCalledTimes(3);
    expect(device.queue.submit).toHaveBeenCalledTimes(3);

    expect(texture.destroy).toHaveBeenCalledTimes(2);
    expect(postProcessRendererStub.onTexturesDestroyed).toHaveBeenCalledTimes(
      1
    );
  });

  it('recreates textures and submits frame when multisampling changes', () => {
    const { device, texture } = WebGPUStubs.createDevice();
    const renderer = new MainRenderer({
      device,
      viewport,
      rendererFactory,
      resourceManager,
    });

    renderer.render(em);
    renderer.setMultisamplingSampleCount(4);
    renderer.render(em);
    renderer.render(em);

    // changes from disabled to enabled -> resolve texture is created
    // -> 2x scene, 2x depth, 1x resolve
    expect(device.createTexture).toHaveBeenCalledTimes(5);
    expect(device.createCommandEncoder).toHaveBeenCalledTimes(3);
    expect(meshRendererStub.render).toHaveBeenCalledTimes(3);
    expect(postProcessRendererStub.render).toHaveBeenCalledTimes(3);
    expect(device.queue.submit).toHaveBeenCalledTimes(3);

    expect(texture.destroy).toHaveBeenCalledTimes(2);
    expect(postProcessRendererStub.onTexturesDestroyed).toHaveBeenCalledTimes(
      1
    );
  });

  it('propagates event and submits frame when aspect scale changes', () => {
    const { device, texture } = WebGPUStubs.createDevice();
    const renderer = new MainRenderer({
      device,
      viewport,
      rendererFactory,
      resourceManager,
    });

    renderer.render(em);
    renderer.queueAspectScaleChange();
    renderer.render(em);
    renderer.render(em);

    expect(device.createTexture).toHaveBeenCalledTimes(2); // scene, depth
    expect(device.createCommandEncoder).toHaveBeenCalledTimes(3);
    expect(meshRendererStub.render).toHaveBeenCalledTimes(3);
    expect(postProcessRendererStub.render).toHaveBeenCalledTimes(3);
    expect(device.queue.submit).toHaveBeenCalledTimes(3);

    expect(texture.destroy).not.toHaveBeenCalled();
    expect(postProcessRendererStub.onTexturesDestroyed).not.toHaveBeenCalled();
    expect(postProcessRendererStub.onAspectScaleChange).toHaveBeenCalledTimes(
      1
    );
  });
});
