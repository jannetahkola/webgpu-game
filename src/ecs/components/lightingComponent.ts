import { vec3, type Vec3 } from 'wgpu-matrix';

export default class LightingComponent {
  target: Vec3;
  intensity: number;
  diffuseBias: number;
  ambient: number;

  direction = vec3.create();

  bufferArray = new Float32Array(6);
  buffer?: GPUBuffer;
  dirty = true;

  getBuffer() {
    if (!this.buffer) throw new Error('Buffer not set');
    return this.buffer;
  }

  constructor({
    target,
    intensity,
    diffuseBias,
    ambient,
  }: {
    target?: Vec3;
    intensity?: number;
    diffuseBias?: number;
    ambient?: number;
  } = {}) {
    this.target = target ?? vec3.fromValues(0, 0, 0);
    this.intensity = intensity ?? 1;
    this.diffuseBias = diffuseBias ?? 0.1;
    this.ambient = ambient ?? 0.25;
  }
}
