import type {
  Material as GltfMaterial,
  Texture as GltfTexture,
} from '@gltf-transform/core';
import { WebIO } from '@gltf-transform/core';
import { assertFloat32Array, assertUint32Array } from '../utils/asserts.ts';
import { KHRMaterialsUnlit } from '@gltf-transform/extensions';

// todo recursive
const urls: Record<string, () => Promise<unknown>> = import.meta.glob(
  './assets/gltf/*.glb',
  {
    query: '?url',
    import: 'default',
  }
);

type Model = {
  meshes: Mesh[];
  materials: Material[];
};

type Mesh = {
  vertexArray: Float32Array;
  vertexBuffer: GPUBuffer;
  indexArray: Uint32Array;
  indexBuffer: GPUBuffer;
  indexCount: number;
  uvArray: Float32Array;
  uvBuffer: GPUBuffer;
  normalArray: Float32Array;
  normalBuffer: GPUBuffer;
  materialRef: string;
  ref: string;
};

type Material = {
  texture: GPUTexture;
  buffer: GPUBuffer;
  unlit: boolean;
};

class GltfManager {
  readonly #io: WebIO;
  readonly #models: Record<string, Model> = {};
  readonly #meshes: Record<string, Mesh> = {};
  readonly #materials: Record<string, Material> = {};
  readonly #textureCache = new Map<GltfTexture, GPUTexture>();
  #defaultTexture?: GPUTexture;

  constructor({ io }: { io?: WebIO } = {}) {
    this.#io = io ?? new WebIO().registerExtensions([KHRMaterialsUnlit]);
  }

  get(url: string) {
    return this.#models[url];
  }

  getMesh(ref: string) {
    return this.#meshes[ref];
  }

  getMaterial(ref: string) {
    return this.#materials[ref];
  }

  async loadGltf(device: GPUDevice) {
    const url = (await urls['./assets/gltf/rubik_cube.glb']?.()) as string;
    const doc = await this.#io.read(url);

    const model: Model = { meshes: [], materials: [] };
    const materials = new Map<string, Material>();

    for (const node of doc.getRoot().listNodes()) {
      const mesh = node.getMesh();
      if (mesh == null) continue;

      for (const prim of mesh.listPrimitives()) {
        const attrPos = prim.getAttribute('POSITION');
        if (attrPos?.getArray() == null) continue;

        const attrUv = prim.getAttribute('TEXCOORD_0');
        if (attrUv?.getArray() == null) continue;

        const attrNormal = prim.getAttribute('NORMAL');
        if (attrNormal?.getArray() == null) continue;

        const indices = prim.getIndices();
        if (indices?.getArray() == null) continue;

        const material = prim.getMaterial();
        if (material === null) continue;

        const vertexArray = assertFloat32Array(attrPos.getArray());
        const vertexBuffer = device.createBuffer({
          label: 'mesh vertex buffer', // todo better labels
          size: vertexArray.byteLength,
          usage: GPUBufferUsage.VERTEX,
          mappedAtCreation: true,
        });
        new Float32Array(vertexBuffer.getMappedRange()).set(vertexArray);
        vertexBuffer.unmap();

        const uvArray = assertFloat32Array(attrUv.getArray());
        const uvBuffer = device.createBuffer({
          label: 'mesh uv buffer',
          size: uvArray.byteLength,
          usage: GPUBufferUsage.VERTEX,
          mappedAtCreation: true,
        });
        new Float32Array(uvBuffer.getMappedRange()).set(uvArray);
        uvBuffer.unmap();

        const normalArray = assertFloat32Array(attrNormal.getArray());
        const normalBuffer = device.createBuffer({
          label: 'mesh normal buffer',
          size: normalArray.byteLength,
          usage: GPUBufferUsage.VERTEX,
          mappedAtCreation: true,
        });
        new Float32Array(normalBuffer.getMappedRange()).set(normalArray);
        normalBuffer.unmap();

        const indexArray = assertUint32Array(indices.getArray());
        const indexCount = indexArray.length;
        const indexBuffer = device.createBuffer({
          label: 'mesh index buffer',
          size: indexArray.byteLength,
          usage: GPUBufferUsage.INDEX,
          mappedAtCreation: true,
        });
        new Uint32Array(indexBuffer.getMappedRange()).set(indexArray);
        indexBuffer.unmap();

        const ref = `${url}#${node.getName()}:${prim.getName()}`;
        const materialRef = `${url}#${material.getName()}:`;
        if (!materials.has(materialRef)) {
          const texture = await this.#loadTexture(device, material);
          const unlit = material.getExtension('KHR_materials_unlit') != null;
          const bufferArray = new Float32Array(4);
          bufferArray.set(material.getBaseColorFactor());
          const buffer = device.createBuffer({
            label: 'material buffer',
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
          });
          new Float32Array(buffer.getMappedRange()).set(bufferArray);
          buffer.unmap();

          const mat: Material = {
            texture,
            buffer,
            unlit,
          };

          materials.set(materialRef, mat);
          model.materials.push(mat);
          this.#materials[materialRef] = mat;
        }

        const mesh: Mesh = {
          vertexArray,
          vertexBuffer,
          indexArray,
          indexBuffer,
          indexCount,
          uvArray,
          uvBuffer,
          normalArray,
          normalBuffer,
          materialRef,
          ref,
        };

        model.meshes.push(mesh);
        this.#meshes[ref] = mesh;
      }
    }

    this.#models['./assets/gltf/rubik_cube.glb'] = model;
  }

  async #loadTexture(device: GPUDevice, material: GltfMaterial) {
    const baseColorTexture = material.getBaseColorTexture();
    if (baseColorTexture?.getImage() == null) {
      return this.#getOrCreateDefaultTexture(device);
    }

    if (this.#textureCache.has(baseColorTexture)) {
      return this.#textureCache.get(baseColorTexture)!;
    }

    const blob = new Blob([baseColorTexture.getImage() as Uint8Array], {
      type: baseColorTexture.getMimeType(),
    });
    const bitmap = await createImageBitmap(blob);
    const width = bitmap.width;
    const height = bitmap.height;

    const texture = device.createTexture({
      label: 'material texture',
      size: [width, height],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    device.queue.copyExternalImageToTexture({ source: bitmap }, { texture }, [
      width,
      height,
    ]);

    bitmap.close();

    this.#textureCache.set(baseColorTexture, texture);

    return texture;
  }

  #getOrCreateDefaultTexture(device: GPUDevice) {
    if (this.#defaultTexture) return this.#defaultTexture;

    const tx = device.createTexture({
      label: 'placeholder texture',
      size: [1, 1],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    device.queue.writeTexture(
      { texture: tx },
      new Uint8Array([255, 255, 255, 255]),
      { bytesPerRow: 4 },
      [1, 1, 1]
    );

    this.#defaultTexture = tx;
    return this.#defaultTexture;
  }
}

export { GltfManager };
