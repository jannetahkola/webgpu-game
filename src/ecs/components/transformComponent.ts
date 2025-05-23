import type { Transform } from '../../rendering/transform.ts';
import { mat4, type Quat, quat, type Vec3, vec3 } from 'wgpu-matrix';

export default class TransformComponent {
  transform: Transform;

  rotationMat = mat4.identity();
  modelMat = mat4.identity();
  modelBuffer?: GPUBuffer;
  normalMat = mat4.identity();
  normalBuffer?: GPUBuffer;
  dirty = true;

  getModelBuffer() {
    if (!this.modelBuffer) throw new Error('Model buffer not set');
    return this.modelBuffer;
  }

  getNormalBuffer() {
    if (!this.normalBuffer) throw new Error('Normal buffer not set');
    return this.normalBuffer;
  }

  constructor({ transform }: { transform?: Partial<Transform> } = {}) {
    const position: Vec3 = transform?.position ?? vec3.create();
    const rotation: Quat = transform?.rotation ?? quat.identity();
    const scale: Vec3 = transform?.scale ?? vec3.fromValues(1, 1, 1);
    this.transform = { position, rotation, scale };
  }
}
