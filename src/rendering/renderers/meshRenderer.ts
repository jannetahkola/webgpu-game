import {
  EntityQuery,
  Lighting,
  Player,
} from '../../ecs/entities/entityManager';
import MeshComponent from '../../ecs/components/meshComponent.ts';
import TransformComponent from '../../ecs/components/transformComponent.ts';
import type { RenderContext } from './renderContext.ts';
import MaterialComponent from '../../ecs/components/materialComponent.ts';
import litPipeline from '../pipelines/litPipeline.ts';
import CameraComponent from '../../ecs/components/cameraComponent.ts';
import LightingComponent from '../../ecs/components/lightingComponent.ts';
import ShadowComponent from '../../ecs/components/shadowComponent.ts';

export default class MeshRenderer {
  readonly #query = new EntityQuery([
    MeshComponent,
    MaterialComponent,
    TransformComponent,
  ]);

  #materialTextureSampler?: GPUSampler;

  render(context: RenderContext) {
    const { device, pass, txScene, txDepth, sampleCount, em, resourceManager } =
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

    const light = em.getSingletonEntity(Lighting);
    const lightingComponent = em.getComponent(light, LightingComponent);
    const shadowComponent = em.getComponent(light, ShadowComponent);

    // todo cache
    const lightingBindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(2),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: lightingComponent.getBuffer(),
          },
        },
      ],
    });

    const shadowBindGroup = device.createBindGroup({
      label: 'shadow bind group',
      layout: pipeline.getBindGroupLayout(3),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: shadowComponent.getBuffer(),
          },
        },
        {
          binding: 1,
          resource: shadowComponent.getDepthTexture().createView(),
        },
        {
          binding: 2,
          resource: shadowComponent.getDepthTextureSampler(),
        },
        {
          binding: 3,
          resource: {
            buffer: shadowComponent.getViewProjectionBuffer(),
          },
        },
      ],
    });

    const cameraComponent = em.getComponent(
      em.getSingletonEntity(Player),
      CameraComponent
    );

    pass.setPipeline(pipeline);
    pass.setBindGroup(2, lightingBindGroup);
    pass.setBindGroup(3, shadowBindGroup);

    for (const e of this.#query.execute(em)) {
      const mesh = resourceManager.getModelMesh(
        em.getComponent(e, MeshComponent).mesh
      );
      const material = resourceManager.getModelMaterial(
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
          {
            binding: 2,
            resource: {
              buffer: transformComponent.getNormalBuffer(),
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
      pass.setVertexBuffer(2, mesh.normalBuffer);
      pass.setIndexBuffer(mesh.indexBuffer, mesh.indexFormat);
      pass.drawIndexed(mesh.indexCount);
    }
  }
}
