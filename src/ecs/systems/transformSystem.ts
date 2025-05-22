import type System from './system.ts';
import { type EntityManager, EntityQuery } from '../entities/entityManager.ts';
import TransformComponent from '../components/transformComponent.ts';
import { mat4 } from 'wgpu-matrix';
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

      // T * R * S
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
      }

      component.modelBuffer ??= this.#device.createBuffer({
        size: 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      this.#device.queue.writeBuffer(
        component.modelBuffer,
        0,
        component.modelMat.buffer
      );

      component.dirty = false;
    }
  }
}
