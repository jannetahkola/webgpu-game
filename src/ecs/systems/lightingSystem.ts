import type System from './system';
import { type EntityManager, Lighting } from '../entities/entityManager.ts';
import LightingComponent from '../components/lightingComponent.ts';
import { vec3 } from 'wgpu-matrix';

export default class LightingSystem implements System {
  readonly #device: GPUDevice;

  constructor(device: GPUDevice) {
    this.#device = device;
  }

  update(_dt: number, em: EntityManager): void {
    const lighting = em.getComponent(
      em.getSingletonEntity(Lighting),
      LightingComponent
    );
    if (!lighting.dirty) return;

    vec3.normalize(lighting.direction, lighting.direction);

    lighting.bufferArray[0] = lighting.direction[0];
    lighting.bufferArray[1] = lighting.direction[1];
    lighting.bufferArray[2] = lighting.direction[2];
    lighting.bufferArray[3] = lighting.intensity;
    lighting.bufferArray[4] = lighting.diffuseBias;

    lighting.buffer ??= this.#device.createBuffer({
      size: 32, // buffer is 20 bytes -> align to 32 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.#device.queue.writeBuffer(
      lighting.getBuffer(),
      0,
      lighting.bufferArray.buffer
    );

    lighting.dirty = false;
  }
}
