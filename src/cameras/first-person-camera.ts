import type Camera from './camera.ts';
import { mat4, type Mat4, vec3 } from 'wgpu-matrix';
import type { Transform } from '../rendering/transform.ts';

export default class FirstPersonCamera implements Camera {
  readonly #viewMat = mat4.identity();
  readonly #projMat = mat4.perspective(Math.PI / 2, 16 / 9, 0.1, 10);
  readonly #viewProjMat = mat4.identity();
  readonly #lookDir = vec3.fromValues(0, 0, -1);
  readonly #target = vec3.create();

  worldForward = vec3.fromValues(0, 0, -1);
  worldUp = vec3.fromValues(0, 1, 0);

  // todo how to do projMat updates? align with world axes

  getProjectionMatrix(): Readonly<Mat4> {
    return this.#projMat;
  }

  getViewMatrix(): Readonly<Mat4> {
    return this.#viewMat;
  }

  getViewProjectionMatrix(): Readonly<Mat4> {
    return this.#viewProjMat;
  }

  update(transform: Transform): void {
    vec3.transformQuat(this.worldForward, transform.rotation, this.#lookDir);
    vec3.add(transform.position, this.#lookDir, this.#target);

    mat4.lookAt(transform.position, this.#target, this.worldUp, this.#viewMat);
    mat4.multiply(this.#projMat, this.#viewMat, this.#viewProjMat);
  }
}
