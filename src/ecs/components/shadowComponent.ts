import { mat4 } from 'wgpu-matrix';

export default class ShadowComponent {
  shadowMapSize: number;

  bufferArray = new Float32Array(1);
  buffer?: GPUBuffer;
  viewProjMat = mat4.identity();
  viewProjBuffer?: GPUBuffer;
  depthTexture?: GPUTexture;
  depthTextureSampler?: GPUSampler;
  dirty = true;

  getBuffer() {
    if (!this.buffer) throw new Error('Buffer not set');
    return this.buffer;
  }

  getViewProjectionBuffer() {
    if (!this.viewProjBuffer) throw new Error('View projection buffer not set');
    return this.viewProjBuffer;
  }

  getDepthTexture() {
    if (!this.depthTexture) throw new Error('Depth texture not set');
    return this.depthTexture;
  }

  getDepthTextureSampler() {
    if (!this.depthTextureSampler)
      throw new Error('Depth texture sampler not set');
    return this.depthTextureSampler;
  }

  constructor({ shadowMapSize }: { shadowMapSize: number }) {
    this.shadowMapSize = shadowMapSize;

    if (shadowMapSize == null || shadowMapSize <= 0) {
      throw new Error('Positive shadow map size is required');
    }
  }
}
