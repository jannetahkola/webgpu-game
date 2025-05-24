import type { RenderContext } from './renderContext.ts';
import { Player, Skybox } from '../../ecs/entities/entityManager.ts';
import CameraComponent from '../../ecs/components/cameraComponent.ts';
import { mat4 } from 'wgpu-matrix';
import skyboxPipeline from '../pipelines/skyboxPipeline.ts';
import { CubeMapComponent } from '../../ecs/components/cubeMapComponent.ts';

export default class SkyboxRenderer {
  readonly #rotationMat = mat4.identity();
  readonly #viewMat = mat4.identity();
  readonly #invViewProjMat = mat4.identity();

  #viewProjBuffer?: GPUBuffer;
  #bindGroup?: GPUBindGroup;
  #sampler?: GPUSampler;

  #zRotation = 0;

  render(context: RenderContext) {
    const { device, pass, txScene, txDepth, em, resourceManager } = context;
    const camera = em.getComponent(
      em.getSingletonEntity(Player),
      CameraComponent
    );
    const cubeMapTxView = resourceManager.getCubeMapTexture(
      em.getComponent(em.getSingletonEntity(Skybox), CubeMapComponent).ref
    );

    this.#zRotation += (Math.PI / 180) * 0.01;

    mat4.identity(this.#viewMat);
    mat4.rotateY(this.#viewMat, -this.#zRotation, this.#rotationMat);
    mat4.rotateZ(this.#rotationMat, -Math.PI / 4, this.#rotationMat);

    const view = mat4.clone(camera.getCamera().getViewMatrix(), this.#viewMat);
    mat4.multiply(this.#viewMat, this.#rotationMat, this.#viewMat);

    const proj = camera.getCamera().getProjectionMatrix();

    // remove translation
    view[12] = 0;
    view[13] = 0;
    view[14] = 0;

    mat4.multiply(proj, view, this.#invViewProjMat);
    mat4.inverse(this.#invViewProjMat, this.#invViewProjMat);

    this.#viewProjBuffer ??= device.createBuffer({
      size: this.#invViewProjMat.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(
      this.#viewProjBuffer,
      0,
      this.#invViewProjMat.buffer
    );

    const pipeline = skyboxPipeline(
      device,
      txScene.format,
      txDepth.format,
      context.sampleCount
    );

    this.#sampler ??= device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    // todo if skybox changes, recreate bind group - maybe store in skybox itself
    this.#bindGroup ??= device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.#viewProjBuffer,
          },
        },
        {
          binding: 1,
          resource: cubeMapTxView,
        },
        {
          binding: 2,
          resource: this.#sampler,
        },
      ],
    });

    pass.setPipeline(pipeline);
    pass.setBindGroup(0, this.#bindGroup);
    pass.draw(3);
  }
}
