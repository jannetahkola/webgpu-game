import type System from './system';
import { type EntityManager, Lighting } from '../entities/entityManager.ts';
import LightingComponent from '../components/lightingComponent.ts';
import { vec3 } from 'wgpu-matrix';
import TransformComponent from '../components/transformComponent.ts';

export default class LightingSystem implements System {
  readonly #device: GPUDevice;

  constructor(device: GPUDevice) {
    this.#device = device;
  }

  update(_dt: number, em: EntityManager): void {
    const light = em.getSingletonEntity(Lighting);
    const lighting = em.getComponent(light, LightingComponent);
    const transform = em.getComponent(light, TransformComponent).transform;
    if (!lighting.dirty) return;

    // const speed = 0.1;
    // const time = performance.now() * 0.001; // seconds
    // const radius = 10;
    //
    // transform.position[0] = Math.cos(time * speed) * radius;
    // transform.position[1] = 1;
    // transform.position[2] = Math.sin(time * speed) * radius;

    vec3.subtract(transform.position, lighting.target, lighting.direction);
    vec3.normalize(lighting.direction, lighting.direction);

    lighting.bufferArray[0] = lighting.direction[0];
    lighting.bufferArray[1] = lighting.direction[1];
    lighting.bufferArray[2] = lighting.direction[2];
    lighting.bufferArray[3] = lighting.intensity;
    lighting.bufferArray[4] = lighting.diffuseBias;
    lighting.bufferArray[5] = lighting.ambient;

    lighting.buffer ??= this.#device.createBuffer({
      size: 32, // align to 32 bytes
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
