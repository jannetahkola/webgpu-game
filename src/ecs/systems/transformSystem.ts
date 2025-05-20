import type System from './system.ts';
import { type EntityManager, EntityQuery } from '../entities/entityManager.ts';
import TransformComponent from '../components/transformComponent.ts';
import { mat4 } from 'wgpu-matrix';

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

      mat4.identity(component.modelMat);
      mat4.translate(transform.position, component.modelMat);
      mat4.fromQuat(transform.rotation, component.rotationMat);
      mat4.multiply(component.rotationMat, component.modelMat);
      mat4.scale(transform.scale, component.modelMat);

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
