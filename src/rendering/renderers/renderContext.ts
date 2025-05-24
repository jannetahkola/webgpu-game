import type { EntityManager } from '../../ecs/entities/entityManager.ts';
import type ResourceManager from '../../resources/resourceManager.ts';

export type MutableRenderContext = {
  device: GPUDevice;
  pass: GPURenderPassEncoder;
  txScene: GPUTexture;
  txDepth: GPUTexture;
  sampleCount: number;
  em: EntityManager;
  resourceManager: ResourceManager;
};

export type RenderContext = Readonly<MutableRenderContext>;

// todo make an interface for Renderers
