import shadowPipeline from '../pipelines/shadowPipeline.ts';
import {
  EntityManager,
  EntityQuery,
  Lighting,
} from '../../ecs/entities/entityManager.ts';
import MeshComponent from '../../ecs/components/meshComponent.ts';
import TransformComponent from '../../ecs/components/transformComponent.ts';
import ShadowComponent from '../../ecs/components/shadowComponent.ts';
import type ResourceManager from '../../resources/resourceManager.ts';

export default class ShadowRenderer {
  readonly #query = new EntityQuery([MeshComponent, TransformComponent]);

  render(
    device: GPUDevice,
    encoder: GPUCommandEncoder,
    em: EntityManager,
    resourceManager: ResourceManager
  ) {
    const shadow = em.getComponent(
      em.getSingletonEntity(Lighting),
      ShadowComponent
    );
    const target = shadow.getDepthTexture();

    const pass = encoder.beginRenderPass({
      colorAttachments: [],
      depthStencilAttachment: {
        view: target.createView(),
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        depthClearValue: 1,
      },
    });

    const pipeline = shadowPipeline(device, target.format);
    pass.setPipeline(pipeline);

    for (const e of this.#query.execute(em)) {
      const meshRef = em.getComponent(e, MeshComponent).mesh;
      if (meshRef.includes('ground')) continue; // todo don't filter like this lol
      const mesh = resourceManager.getModelMesh(meshRef);
      const transform = em.getComponent(e, TransformComponent);

      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: {
              buffer: shadow.getViewProjectionBuffer(),
            },
          },
          {
            binding: 1,
            resource: {
              buffer: transform.getModelBuffer(),
            },
          },
        ],
      });

      pass.setBindGroup(0, bindGroup);
      pass.setVertexBuffer(0, mesh.vertexBuffer);
      pass.setIndexBuffer(mesh.indexBuffer, mesh.indexFormat);
      pass.drawIndexed(mesh.indexCount);
    }

    pass.end();
  }
}
