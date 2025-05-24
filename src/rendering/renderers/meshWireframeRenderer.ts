import type { RenderContext } from './renderContext.ts';
import { EntityQuery, Player } from '../../ecs/entities/entityManager.ts';
import CameraComponent from '../../ecs/components/cameraComponent.ts';
import lineIndexPipeline from '../pipelines/lineIndexPipeline.ts';
import TransformComponent from '../../ecs/components/transformComponent.ts';
import MeshComponent from '../../ecs/components/meshComponent.ts';
import MeshWireframeComponent from '../../ecs/components/meshWireframeComponent.ts';

export default class MeshWireframeRenderer {
  readonly #query = new EntityQuery([
    MeshComponent,
    TransformComponent,
    MeshWireframeComponent,
  ]);

  render(context: RenderContext) {
    const { device, pass, txScene, txDepth, sampleCount, em, resourceManager } =
      context;

    const camera = em.getComponent(
      em.getSingletonEntity(Player),
      CameraComponent
    );

    const pipeline = lineIndexPipeline(
      device,
      txScene.format,
      txDepth.format,
      sampleCount
    );

    pass.setPipeline(pipeline);

    for (const e of this.#query.execute(em)) {
      const modelComponent = em.getComponent(e, MeshComponent);
      const transformComponent = em.getComponent(e, TransformComponent);
      const mesh = resourceManager.getModelMesh(modelComponent.mesh);

      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: {
              buffer: camera.getViewProjectionBuffer(),
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

      pass.setBindGroup(0, bindGroup);
      pass.setVertexBuffer(0, mesh.vertexBuffer);
      pass.setIndexBuffer(mesh.lineIndexBuffer, mesh.indexFormat);
      pass.drawIndexed(mesh.lineIndexCount);
    }
  }
}
