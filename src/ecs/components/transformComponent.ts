import type { Transform } from '../../rendering/transform.ts';
import { mat4, type Mat4, type Quat, quat, type Vec3, vec3 } from 'wgpu-matrix';

export default class TransformComponent {
  transform: Transform;

  rotationMat: Mat4 = mat4.identity();
  modelMat: Mat4 = mat4.identity();
  modelBuffer?: GPUBuffer;
  dirty = true;

  getModelBuffer() {
    if (!this.modelBuffer) throw new Error('Model buffer not set');
    return this.modelBuffer;
  }

  constructor({ transform }: { transform?: Partial<Transform> } = {}) {
    const position: Vec3 = transform?.position ?? vec3.create();
    const rotation: Quat = transform?.rotation ?? quat.identity();
    const scale: Vec3 = transform?.scale ?? vec3.fromValues(1, 1, 1);
    this.transform = { position, rotation, scale };
  }
}
