import type System from './system.ts';
import { type EntityManager, EntityQuery } from '../entities/entityManager.ts';
import TransformComponent from '../components/transformComponent.ts';
import { mat3, mat4 } from 'wgpu-matrix';
import ParentComponent from '../components/parentComponent.ts';

export default class TransformSystem implements System {
  readonly #query = new EntityQuery([TransformComponent]);
  readonly #device: GPUDevice;

  constructor(device: GPUDevice) {
    this.#device = device;
  }

  update(_dt: number, em: EntityManager): void {
    for (const e of this.#query.execute(em)) {
      const component = em.getComponent(e, TransformComponent);
      const transform = component.transform;

      if (!component.dirty) continue;

      const modelMatrix = component.modelMat;
      const normalMatrix = component.normalMat;

      // T * R * S -> model
      mat4.identity(modelMatrix);
      mat4.translate(modelMatrix, transform.position, modelMatrix);
      mat4.fromQuat(transform.rotation, component.rotationMat);
      mat4.multiply(modelMatrix, component.rotationMat, modelMatrix);
      mat4.scale(modelMatrix, transform.scale, modelMatrix);

      const parent = em.getComponentOpt(e, ParentComponent)?.parent;
      if (parent != null) {
        // todo test 0 works
        const parentComponent = em.getComponent(parent, TransformComponent);
        mat4.multiply(modelMatrix, parentComponent.modelMat, modelMatrix);
        console.log('parent', parent);
      }

      // Inverse transpose of model -> normal
      mat3.fromMat4(modelMatrix, normalMatrix);
      mat3.invert(normalMatrix, normalMatrix);
      mat3.transpose(normalMatrix, normalMatrix);

      component.modelBuffer ??= this.#device.createBuffer({
        size: modelMatrix.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      component.normalBuffer ??= this.#device.createBuffer({
        size: normalMatrix.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      this.#device.queue.writeBuffer(
        component.modelBuffer,
        0,
        modelMatrix.buffer
      );

      this.#device.queue.writeBuffer(
        component.normalBuffer,
        0,
        normalMatrix.buffer
      );

      component.dirty = false;
    }
  }
}
