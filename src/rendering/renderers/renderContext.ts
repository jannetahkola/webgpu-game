import type { EntityManager } from '../../ecs/entities/entityManager.ts';
import type { GltfManager } from '../../resources/gltf.ts';

export type MutableRenderContext = {
  device: GPUDevice;
  pass: GPURenderPassEncoder;
  txScene: GPUTexture;
  txDepth: GPUTexture;
  sampleCount: number;
  em: EntityManager;
  gltfManager: GltfManager;
};

export type RenderContext = Readonly<MutableRenderContext>;

// todo make an interface for Renderers
