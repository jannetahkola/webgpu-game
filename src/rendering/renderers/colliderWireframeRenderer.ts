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
    const { device, pass, txScene, txDepth, sampleCount, em } = context;

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

      pass.setBindGroup(0, bindGroup);
      pass.setVertexBuffer(0, wireframeComponent.getVertexBuffer());
      pass.setIndexBuffer(wireframeComponent.getLineIndexBuffer(), 'uint16');
      pass.drawIndexed(wireframeComponent.getLineIndexCount());
    }
  }
}
