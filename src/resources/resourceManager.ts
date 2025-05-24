import { GltfManager } from './gltf.ts';
import { CubeMapManager } from './cubemap.ts';
import type ResourceManagerFactory from './resourceManagerFactory.ts';

export default class ResourceManager {
  readonly #gltf: GltfManager;
  readonly #cubeMap: CubeMapManager;

  constructor(resourceManagerFactory: ResourceManagerFactory) {
    this.#gltf = resourceManagerFactory.create(GltfManager);
    this.#cubeMap = resourceManagerFactory.create(CubeMapManager);
  }

  async loadModels(device: GPUDevice, refs: string[]) {
    return this.#gltf.loadGltf(device, refs);
  }

  async loadCubeMaps(device: GPUDevice, refs: string[]) {
    return this.#cubeMap.loadCubeMap(device, refs);
  }

  getModel(ref: string) {
    return this.#gltf.get(ref);
  }

  getModelMesh(ref: string) {
    return this.#gltf.getMesh(ref);
  }

  getModelMaterial(ref: string) {
    return this.#gltf.getMaterial(ref);
  }

  getCubeMapTexture(ref: string) {
    return this.#cubeMap.get(ref);
  }
}
