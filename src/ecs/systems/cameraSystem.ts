import { Player, type EntityManager } from '../entities/entityManager';
import TransformComponent from '../components/transformComponent.ts';
import CameraComponent from '../components/cameraComponent.ts';
import type System from './system.ts';

export default class CameraSystem implements System {
  readonly #device: GPUDevice;

  constructor(device: GPUDevice) {
    this.#device = device;
  }

  update(_dt: number, em: EntityManager) {
    const player = em.getSingletonEntity(Player);
    const cameraComponent = em.getComponent(player, CameraComponent);
    const camera = cameraComponent.getCamera();
    const transform = em.getComponent(player, TransformComponent).transform;

    camera.update(transform);

    cameraComponent.viewProjBuffer ??= this.#device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.#device.queue.writeBuffer(
      cameraComponent.viewProjBuffer,
      0,
      camera.getViewProjectionMatrix().buffer
    );
  }
}
