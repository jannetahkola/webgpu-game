import { type Viewport } from '../../viewport/viewport.ts';
import RendererFactory from './rendererFactory.ts';
import PostProcessRenderer from './postprocessRenderer.ts';
import type { MutableRenderContext, RenderContext } from './renderContext.ts';
import type { EntityManager } from '../../ecs/entities/entityManager.ts';
import type { GltfManager } from '../../resources/gltf.ts';
import MeshRenderer from './meshRenderer.ts';

type MainRendererOptions = {
  clearValue: number[];
  multisampling: number;
};

export default class MainRenderer {
  readonly #device: GPUDevice;
  readonly #viewport: Viewport;
  readonly #rendererFactory: RendererFactory;
  readonly #gltfManager: GltfManager;
  readonly #options: MainRendererOptions;

  readonly #rMesh;
  readonly #rPostProcess;

  readonly #context: Partial<MutableRenderContext> = {};

  #txScene?: GPUTexture;
  #txDepth?: GPUTexture;
  #txResolve?: GPUTexture;

  #aspectScaleChanged = false;
  #resolutionChanged = false;
  #multisamplingChanged = false;

  constructor({
    device,
    viewport,
    rendererFactory,
    gltfManager,
    options,
  }: {
    device: GPUDevice;
    viewport: Viewport;
    rendererFactory: RendererFactory;
    gltfManager: GltfManager;
    options?: Partial<MainRendererOptions>;
  }) {
    this.#device = device;
    this.#viewport = viewport;
    this.#rendererFactory = rendererFactory;
    this.#gltfManager = gltfManager;
    this.#options = {
      ...{ clearValue: [0, 0, 0, 1], multisampling: 1 },
      ...options,
    };

    this.#rMesh = this.#rendererFactory.create(MeshRenderer);
    this.#rPostProcess = this.#rendererFactory.create(PostProcessRenderer);
  }

  queueAspectScaleChange() {
    this.#aspectScaleChanged = true;
  }

  queueResolutionChange() {
    this.#resolutionChanged = true;
  }

  setMultisamplingSampleCount(count: number) {
    if (this.#options.multisampling === count) return;
    this.#options.multisampling = count;
    this.#multisamplingChanged = true;
  }

  render(em: EntityManager) {
    this.#applyChanges();

    const device = this.#device;
    const viewport = this.#viewport;
    const gltfManager = this.#gltfManager;
    const sampleCount = this.#options.multisampling;

    const multisample = sampleCount > 1;

    const txScene = this.#getOrCreateSceneTexture();
    const txDepth = this.#getOrCreateDepthTexture();
    const txResolve = this.#getOrCreateResolveTexture(multisample);
    const txCanvas = viewport.getContext().getCurrentTexture();

    // const start = performance.now();
    // void device.queue.onSubmittedWorkDone().then(() => {
    //   // console.log('done', performance.now() - start);
    // });

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: txScene.createView(),
          resolveTarget: txResolve?.createView(),
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: this.#options.clearValue,
        },
      ],
      depthStencilAttachment: {
        view: txDepth.createView(),
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        depthClearValue: 1.0,
      },
    });

    {
      const context = this.#context;
      context.device = device;
      context.pass = pass;
      context.txScene = txScene;
      context.txDepth = txDepth;
      context.sampleCount = sampleCount;
      context.em = em;
      context.gltfManager = gltfManager;
    }

    const context = this.#context as RenderContext;

    this.#rMesh.render(context);
    this.#rPostProcess.render(pass);

    pass.end();

    this.#rPostProcess.toCanvas(
      device,
      encoder,
      txResolve ?? txScene,
      txCanvas
    );

    device.queue.submit([encoder.finish()]);
  }

  #getOrCreateSceneTexture() {
    if (!this.#txScene) {
      console.log('new scene texture');
    }

    this.#txScene ??= this.#device.createTexture({
      label: 'scene texture',
      size: {
        width: this.#viewport.getResolution().w,
        height: this.#viewport.getResolution().h,
      },
      format: 'rgba8unorm',
      sampleCount: this.#options.multisampling,
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.COPY_DST,
    });

    return this.#txScene;
  }

  #getOrCreateDepthTexture() {
    if (!this.#txDepth) {
      console.log('new depth texture');
    }

    this.#txDepth ??= this.#device.createTexture({
      label: 'depth texture',
      size: {
        width: this.#viewport.getResolution().w,
        height: this.#viewport.getResolution().h,
      },
      format: 'depth24plus',
      sampleCount: this.#options.multisampling,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    return this.#txDepth;
  }

  #getOrCreateResolveTexture(multisample: boolean) {
    if (!multisample) return undefined;

    if (!this.#txResolve) {
      console.log('new resolve texture');
    }

    this.#txResolve ??= this.#device.createTexture({
      label: 'resolve texture',
      size: {
        width: this.#viewport.getResolution().w,
        height: this.#viewport.getResolution().h,
      },
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_SRC,
    });

    return this.#txResolve;
  }

  #destroyTextures() {
    console.log('destroy textures');
    this.#txScene?.destroy();
    this.#txDepth?.destroy();
    this.#txResolve?.destroy();
    this.#txScene = undefined;
    this.#txDepth = undefined;
    this.#txResolve = undefined;
  }

  #applyChanges() {
    const destroyTextures =
      this.#multisamplingChanged || this.#resolutionChanged;

    if (destroyTextures) {
      this.#destroyTextures();
      this.#rPostProcess.onTexturesDestroyed();
    }

    if (this.#aspectScaleChanged) {
      this.#rPostProcess.onAspectScaleChange(
        this.#device,
        this.#viewport.getAspectScale()
      );
    }

    this.#multisamplingChanged = false;
    this.#aspectScaleChanged = false;
    this.#resolutionChanged = false;
  }
}
