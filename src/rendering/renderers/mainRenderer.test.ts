import { WebGPUStubs } from '../../../tests/stubs.ts';
import MainRenderer from './mainRenderer.ts';
import type { Viewport } from '../../viewport/viewport.ts';
import RendererFactory from './rendererFactory.ts';
import PostProcessRenderer from './postprocessRenderer.ts';
import type { GltfManager } from '../../resources/gltf.ts';
import { EntityManager } from '../../ecs/entities/entityManager.ts';
import MeshRenderer from './meshRenderer.ts';

describe('MainRenderer', () => {
  let meshRendererStub: MeshRenderer;
  let postProcessRendererStub: PostProcessRenderer;

  let viewport: Viewport;
  let rendererFactory: RendererFactory;
  let gltfManager: GltfManager;

  let em: EntityManager;

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

    rendererFactory = {
      create: vi.fn(
        <T>(Ctor: new (...args: unknown[]) => T, ..._args: unknown[]): T => {
          if (Ctor === MeshRenderer) {
            return meshRendererStub as T;
          }
          if (Ctor === PostProcessRenderer) {
            return postProcessRendererStub as T;
          }
          throw new Error('Unknown renderer: ' + Ctor.name);
        }
      ),
    };

    gltfManager = {
      get: vi.fn(),
      getMesh: vi.fn(),
      getMaterial: vi.fn(),
      loadGltf: vi.fn(),
    } as unknown as GltfManager;

    em = new EntityManager();
  });

  it('creates textures and submits frame', () => {
    const { device } = WebGPUStubs.createDevice();
    const renderer = new MainRenderer({
      device,
      viewport,
      rendererFactory,
      gltfManager,
    });

    renderer.render(em);

    expect(device.createTexture).toHaveBeenCalledTimes(2);
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
      gltfManager,
      options: { multisampling: 4 },
    });

    renderer.render(em);

    expect(device.createTexture).toHaveBeenCalledTimes(3);
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
      gltfManager,
    });

    renderer.render(em);
    renderer.queueResolutionChange();
    renderer.render(em);
    renderer.render(em);

    expect(device.createTexture).toHaveBeenCalledTimes(4);
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
      gltfManager,
    });

    renderer.render(em);
    renderer.setMultisamplingSampleCount(4);
    renderer.render(em);
    renderer.render(em);

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
      gltfManager,
    });

    renderer.render(em);
    renderer.queueAspectScaleChange();
    renderer.render(em);
    renderer.render(em);

    expect(device.createTexture).toHaveBeenCalledTimes(2);
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
