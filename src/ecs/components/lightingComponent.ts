import { vec3, type Vec3 } from 'wgpu-matrix';

export default class LightingComponent {
  direction: Vec3;
  intensity: number;
  diffuseBias: number;
  bufferArray = new Float32Array(5);
  buffer?: GPUBuffer;
  dirty = true;

  getBuffer() {
    if (!this.buffer) throw new Error('Buffer not set');
    return this.buffer;
  }

  constructor({
    direction,
    intensity,
    diffuseBias,
  }: {
    direction?: Vec3;
    intensity?: number;
    diffuseBias?: number;
  } = {}) {
    this.direction = direction ?? vec3.fromValues(0, 1, 1);
    this.intensity = intensity ?? 1;
    this.diffuseBias = diffuseBias ?? 0.2;
  }
}
