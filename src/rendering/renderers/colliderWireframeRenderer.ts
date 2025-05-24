import { EntityQuery, Player } from '../../ecs/entities/entityManager.ts';
import TransformComponent from '../../ecs/components/transformComponent.ts';
import ColliderWireframeComponent from '../../ecs/components/colliderWireframeComponent.ts';
import type { RenderContext } from './renderContext.ts';
import lineIndexPipeline from '../pipelines/lineIndexPipeline.ts';
import ColliderComponent from '../../ecs/components/colliderComponent.ts';
import CameraComponent from '../../ecs/components/cameraComponent.ts';
import ModelComponent from '../../ecs/components/modelComponent.ts';

export default class ColliderWireframeRenderer {
  readonly #query = new EntityQuery([
    ModelComponent, // todo do we need to ensure this here?
    TransformComponent,
    ColliderComponent,
    ColliderWireframeComponent,
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
      const transformComponent = em.getComponent(e, TransformComponent);
      const colliderComponent = em.getComponent(e, ColliderComponent);
      const wireframeComponent = em.getComponent(e, ColliderWireframeComponent);

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

      if (colliderComponent.collider.type === 'box') {
        const vertexBuffer = wireframeComponent.getVertexBuffer();
        const indexBuffer = wireframeComponent.getLineIndexBuffer();
        const indexCount = wireframeComponent.getLineIndexCount();

        pass.setBindGroup(0, bindGroup);
        pass.setVertexBuffer(0, vertexBuffer);
        pass.setIndexBuffer(indexBuffer, 'uint16');
        pass.drawIndexed(indexCount);
      } else if (colliderComponent.collider.type === 'mesh') {
        for (const mesh of resourceManager.getModel(
          colliderComponent.collider.ref
        ).meshes) {
          const vertexBuffer = mesh.vertexBuffer;
          const indexBuffer = mesh.lineIndexBuffer;
          const indexCount = mesh.lineIndexCount;

          pass.setBindGroup(0, bindGroup);
          pass.setVertexBuffer(0, vertexBuffer);
          pass.setIndexBuffer(indexBuffer, mesh.indexFormat);
          pass.drawIndexed(indexCount);
        }
      }
    }
  }
}
