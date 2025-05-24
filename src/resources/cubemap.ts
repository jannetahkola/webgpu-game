const urls: Record<string, () => Promise<unknown>> = import.meta.glob(
  './assets/cubemaps/**/*.png',
  {
    query: '?url',
    import: 'default',
  }
);

const orderedFaces = [
  '/px.png',
  '/nx.png',
  '/py.png',
  '/ny.png',
  '/nz.png',
  '/pz.png',
];

class CubeMapManager {
  // todo use a map or record in these managers - not both
  readonly #cubeMaps = new Map<string, GPUTextureView>();

  get(ref: string) {
    const cubeMap = this.#cubeMaps.get(ref);
    if (!cubeMap) throw new Error(`Cubemap ${ref} not found`);
    return cubeMap;
  }

  async loadCubeMap(device: GPUDevice, refs: string[]) {
    for (const ref of refs) {
      if (this.#cubeMaps.has(ref)) continue;

      const promises = orderedFaces.map(async (face) => {
        const key = ref + face;

        if (!urls[key]) {
          throw new Error(`Cubemap ${ref} not found` + Object.keys(urls));
        }

        return fetch((await urls[key]?.()) as string)
          .then((res) => res.blob())
          .then((blob) =>
            createImageBitmap(
              blob,
              // flip y for z faces
              face.includes('z.png')
                ? {
                    imageOrientation: 'flipY',
                  }
                : undefined
            )
          );
      });

      const faces = await Promise.all(promises);

      const texture = device.createTexture({
        size: [faces[0].width, faces[0].height, 6],
        format: 'rgba8unorm',
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
        dimension: '2d',
      });

      for (let i = 0; i < 6; i++) {
        device.queue.copyExternalImageToTexture(
          { source: faces[i] },
          { texture, origin: [0, 0, i] },
          [faces[i].width, faces[i].height, 1]
        );
      }

      this.#cubeMaps.set(ref, texture.createView({ dimension: 'cube' }));
    }
  }
}

export { CubeMapManager };
