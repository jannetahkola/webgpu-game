import { EntityQuery } from '../../ecs/entities/entityManager';
import MeshComponent from '../../ecs/components/meshComponent.ts';
import TransformComponent from '../../ecs/components/transformComponent.ts';
import type { RenderContext } from './renderContext.ts';
import MaterialComponent from '../../ecs/components/materialComponent.ts';
import litPipeline from '../pipelines/litPipeline.ts';
import CameraComponent from '../../ecs/components/cameraComponent.ts';
import { Player } from '../../ecs/entities/singletonEntityTag.ts';

export default class MeshRenderer {
  readonly #query = new EntityQuery([
    MeshComponent,
    MaterialComponent,
    TransformComponent,
  ]);

  #materialTextureSampler?: GPUSampler;

  render(context: RenderContext) {
    const { device, pass, txScene, txDepth, sampleCount, em, gltfManager } =
      context;

    this.#materialTextureSampler ??= device.createSampler({
      label: 'material texture sampler',
      addressModeU: 'repeat',
      addressModeV: 'repeat',
      magFilter: 'linear',
      minFilter: 'linear',
    });

    const pipeline = litPipeline(
      device,
      txScene.format,
      txDepth.format,
      sampleCount
    );

    pass.setPipeline(pipeline);

    const cameraComponent = em.getSingletonComponent(Player, CameraComponent);

    for (const e of this.#query.execute(em)) {
      const mesh = gltfManager.getMesh(em.getComponent(e, MeshComponent).mesh);
      const material = gltfManager.getMaterial(
        em.getComponent(e, MaterialComponent).material
      );
      const transformComponent = em.getComponent(e, TransformComponent);

      const uniformBindGroup = device.createBindGroup({
        label: 'mesh uniform bind group',
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: {
              buffer: cameraComponent.getViewProjectionBuffer(),
            },
          },
          {
            binding: 1,
            resource: {
              buffer: transformComponent.getModelBuffer(),
            },
          },
        ],
      });

      const materialBindGroup = device.createBindGroup({
        label: 'mesh material bind group',
        layout: pipeline.getBindGroupLayout(1),
        entries: [
          {
            binding: 0,
            resource: {
              buffer: material.buffer,
            },
          },
          {
            binding: 1,
            resource: material.texture.createView(),
          },
          {
            binding: 2,
            resource: this.#materialTextureSampler,
          },
        ],
      });

      pass.setBindGroup(0, uniformBindGroup);
      pass.setBindGroup(1, materialBindGroup);
      pass.setVertexBuffer(0, mesh.vertexBuffer);
      pass.setVertexBuffer(1, mesh.uvBuffer);
      // pass.setVertexBuffer(2, mesh.normalBuffer);
      pass.setIndexBuffer(mesh.indexBuffer, 'uint32');
      pass.drawIndexed(mesh.indexCount);
    }
  }
}
