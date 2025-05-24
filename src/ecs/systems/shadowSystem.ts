import { type EntityManager, Lighting } from '../entities/entityManager';
import type System from './system';
import LightingComponent from '../components/lightingComponent.ts';
import ShadowComponent from '../components/shadowComponent.ts';
import TransformComponent from '../components/transformComponent.ts';
import { mat4 } from 'wgpu-matrix';

export default class ShadowSystem implements System {
  readonly #device: GPUDevice;

  constructor(device: GPUDevice) {
    this.#device = device;
  }

  update(_dt: number, em: EntityManager): void {
    const light = em.getSingletonEntity(Lighting);
    const lighting = em.getComponent(light, LightingComponent);
    const shadow = em.getComponent(light, ShadowComponent);
    if (!shadow.dirty) return;

    const transform = em.getComponent(light, TransformComponent).transform;

    const s = 10;
    const viewProjMat = shadow.viewProjMat;
    const view = mat4.lookAt(transform.position, lighting.target, [0, 1, 0]); // todo extract world up
    const proj = mat4.ortho(-s, s, -s, s, 0.1, 100);
    mat4.multiply(proj, view, viewProjMat);

    shadow.bufferArray[0] = shadow.shadowMapSize;

    shadow.buffer ??= this.#device.createBuffer({
      size: 32, // align to 32 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.#device.queue.writeBuffer(shadow.buffer, 0, shadow.bufferArray.buffer);

    shadow.viewProjBuffer ??= this.#device.createBuffer({
      size: viewProjMat.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.#device.queue.writeBuffer(
      shadow.viewProjBuffer,
      0,
      viewProjMat.buffer
    );

    shadow.depthTexture ??= this.#device.createTexture({
      label: 'shadow depth texture',
      size: [shadow.shadowMapSize, shadow.shadowMapSize],
      format: 'depth32float',
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    shadow.depthTextureSampler ??= this.#device.createSampler({
      label: 'shadow depth texture sampler',
      compare: 'less',
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });

    shadow.dirty = false;
  }
}
