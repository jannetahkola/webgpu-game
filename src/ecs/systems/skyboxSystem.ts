import {
  type EntityManager,
  Player,
  Skybox,
} from '../entities/entityManager.ts';
import type System from './system.ts';
import CameraComponent from '../components/cameraComponent.ts';
import SkyboxComponent from '../components/skyboxComponent.ts';
import { mat4 } from 'wgpu-matrix';

export default class SkyboxSystem implements System {
  readonly #device: GPUDevice;

  constructor(device: GPUDevice) {
    this.#device = device;
  }

  update(_dt: number, em: EntityManager): void {
    const skybox = em.getComponent(
      em.getSingletonEntity(Skybox),
      SkyboxComponent
    );
    const camera = em.getComponent(
      em.getSingletonEntity(Player),
      CameraComponent
    );

    // this.#zRotation += (Math.PI / 180) * 0.01;
    //
    // mat4.identity(this.#viewMat);
    // mat4.rotateY(this.#viewMat, -this.#zRotation, this.#rotationMat);
    // mat4.rotateZ(this.#rotationMat, -Math.PI / 4, this.#rotationMat);

    // const view = mat4.clone(camera.getCamera().getViewMatrix(), this.#viewMat);
    // mat4.multiply(this.#viewMat, this.#rotationMat, this.#viewMat);

    const view = mat4.clone(camera.getCamera().getViewMatrix(), skybox.viewMat);
    const proj = camera.getCamera().getProjectionMatrix();

    // remove translation
    view[12] = 0;
    view[13] = 0;
    view[14] = 0;

    mat4.multiply(proj, view, skybox.invViewProjMat);
    mat4.inverse(skybox.invViewProjMat, skybox.invViewProjMat);

    skybox.invViewProjBuffer ??= this.#device.createBuffer({
      size: skybox.invViewProjMat.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.#device.queue.writeBuffer(
      skybox.invViewProjBuffer,
      0,
      skybox.invViewProjMat.buffer
    );
  }
}
