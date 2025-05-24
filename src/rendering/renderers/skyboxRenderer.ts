import type { RenderContext } from './renderContext.ts';
import { Skybox } from '../../ecs/entities/entityManager.ts';
import skyboxPipeline from '../pipelines/skyboxPipeline.ts';
import { CubeMapComponent } from '../../ecs/components/cubeMapComponent.ts';
import SkyboxComponent from '../../ecs/components/skyboxComponent.ts';

export default class SkyboxRenderer {
  #bindGroup?: GPUBindGroup;
  #sampler?: GPUSampler;

  render(context: RenderContext) {
    const { device, pass, txScene, txDepth, em, resourceManager } = context;
    const skybox = em.getComponent(
      em.getSingletonEntity(Skybox),
      SkyboxComponent
    );
    const cubeMapTxView = resourceManager.getCubeMapTexture(
      em.getComponent(em.getSingletonEntity(Skybox), CubeMapComponent).ref
    );

    const pipeline = skyboxPipeline(
      device,
      txScene.format,
      txDepth.format,
      context.sampleCount
    );

    // todo move to a component + creation to a system
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
            buffer: skybox.getInverseViewProjectionBuffer(),
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
