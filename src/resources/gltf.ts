import type {
  Material as GltfMaterial,
  Texture as GltfTexture,
} from '@gltf-transform/core';
import { WebIO } from '@gltf-transform/core';
import { assertFloat32Array } from '../utils/asserts.ts';
import { KHRMaterialsUnlit } from '@gltf-transform/extensions';
import CssLog from '../logging/logging.ts';

const urls: Record<string, () => Promise<unknown>> = import.meta.glob(
  './assets/gltf/**/*.glb',
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
  indexArray: Uint16Array | Uint32Array;
  indexBuffer: GPUBuffer;
  indexCount: number;
  indexFormat: GPUIndexFormat;
  lineIndexArray: Uint16Array | Uint32Array;
  lineIndexBuffer: GPUBuffer;
  lineIndexCount: number;
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
  readonly #textures = new Map<GltfTexture, GPUTexture>();
  #defaultTexture?: GPUTexture;

  constructor({ io }: { io?: WebIO } = {}) {
    this.#io = io ?? new WebIO().registerExtensions([KHRMaterialsUnlit]);
  }

  get(ref: string) {
    const model = this.#models[ref];
    if (!model) throw new Error(`Model '${ref}' not found`);
    return model;
  }

  getMesh(ref: string) {
    const mesh = this.#meshes[ref];
    if (!mesh)
      throw new Error(
        `Mesh '${ref}' not found, meshes: ` +
          Object.keys(this.#meshes).join('\n')
      );
    return mesh;
  }

  getMaterial(ref: string) {
    const material = this.#materials[ref];
    if (!material) throw new Error(`Material '${ref}' not found`);
    return material;
  }

  async loadGltf(device: GPUDevice, refs: string[]) {
    const promises = [];

    for (const ref of new Set(refs)) {
      if (this.#models[ref]) continue;
      if (!urls[ref]) throw new Error(`gltf ${ref} not found`);

      promises.push(
        (async () => {
          const start = performance.now();

          const url = (await urls[ref]?.()) as string;
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

              const indexArray = indices.getArray()!; // nullability checked above
              const indexCount = indexArray.length;
              const indexBuffer = device.createBuffer({
                label: 'mesh index buffer',
                size: indexArray.byteLength,
                usage: GPUBufferUsage.INDEX,
                mappedAtCreation: true,
              });
              let indexFormat!: GPUIndexFormat;
              if (indexArray instanceof Uint16Array) {
                new Uint16Array(indexBuffer.getMappedRange()).set(indexArray);
                indexFormat = 'uint16';
              } else if (indexArray instanceof Uint32Array) {
                new Uint32Array(indexBuffer.getMappedRange()).set(indexArray);
                indexFormat = 'uint32';
              } else {
                throw new Error(
                  'Unsupported index type: ' + indexArray.constructor.name
                );
              }
              indexBuffer.unmap();

              // todo similar to collider wireframes, should probably be done in the wireframe system
              const lineIndexArray = this.#generateLineIndices(indexArray);
              const lineIndexCount = lineIndexArray.length;
              const lineIndexBuffer = device.createBuffer({
                label: 'mesh line index buffer',
                size: lineIndexArray.byteLength,
                usage: GPUBufferUsage.INDEX,
                mappedAtCreation: true,
              });
              if (lineIndexArray instanceof Uint16Array) {
                new Uint16Array(lineIndexBuffer.getMappedRange()).set(
                  lineIndexArray
                );
              } else {
                new Uint32Array(lineIndexBuffer.getMappedRange()).set(
                  lineIndexArray
                );
              }
              lineIndexBuffer.unmap();

              const ref = `${url}#${node.getName()}:${prim.getName()}`;
              const materialRef = `${url}#${material.getName()}`;
              if (!materials.has(materialRef)) {
                const texture = await this.#loadTexture(device, material);
                const unlit =
                  material.getExtension('KHR_materials_unlit') != null;
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
                indexFormat,
                lineIndexArray,
                lineIndexBuffer,
                lineIndexCount,
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

          this.#models[ref] = model;

          console.log(...CssLog.successTimed('gltf loaded', start, ref));
        })()
      );
    }

    await Promise.all(promises);
  }

  async #loadTexture(device: GPUDevice, material: GltfMaterial) {
    const baseColorTexture = material.getBaseColorTexture();
    if (baseColorTexture?.getImage() == null) {
      return this.#getOrCreateDefaultTexture(device);
    }

    if (this.#textures.has(baseColorTexture)) {
      return this.#textures.get(baseColorTexture)!;
    }

    const blob = new Blob([baseColorTexture.getImage()!], {
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

    this.#textures.set(baseColorTexture, texture);

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

  #generateLineIndices(
    indices: Uint16Array | Uint32Array
  ): Uint16Array | Uint32Array {
    const edges = new Set<string>();
    const lineIndices: number[] = [];

    for (let i = 0; i < indices.length; i += 3) {
      const tri = [indices[i], indices[i + 1], indices[i + 2]];

      const pairs = [
        [tri[0], tri[1]],
        [tri[1], tri[2]],
        [tri[2], tri[0]],
      ];

      for (const pair of pairs) {
        const key = pair.toSorted((x, y) => x - y).join('-');
        if (!edges.has(key)) {
          edges.add(key);
          lineIndices.push(pair[0], pair[1]);
        }
      }
    }

    if (indices instanceof Uint16Array) {
      return new Uint16Array(lineIndices);
    }

    return new Uint32Array(lineIndices);
  }
}

export { GltfManager };
