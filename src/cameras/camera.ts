import type { Mat4, Vec3 } from 'wgpu-matrix';
import type { Transform } from '../rendering/transform';

export default interface Camera {
  worldForward: Vec3;
  worldUp: Vec3;

  getViewMatrix(): Readonly<Mat4>;

  getProjectionMatrix(): Readonly<Mat4>;

  getViewProjectionMatrix(): Readonly<Mat4>;

  update(transform: Transform): void;
}
