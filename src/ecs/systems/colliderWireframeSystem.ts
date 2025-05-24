import { type EntityManager, EntityQuery } from '../entities/entityManager.ts';
import type System from './system.ts';
import ColliderComponent from '../components/colliderComponent.ts';
import { vec3 } from 'wgpu-matrix';
import type { BoxCollider } from '../../physics/colliders.ts';
import DiagnosticsResource from '../resources/diagnosticsResource.ts';
import ColliderWireframeComponent from '../components/colliderWireframeComponent.ts';
import TransformComponent from '../components/transformComponent.ts';
import ModelComponent from '../components/modelComponent.ts';

// todo move these somewhere

// prettier-ignore
const boxLineIndices = new Uint16Array([
  0, 1,
  1, 3,
  3, 2,
  2, 0, // bottom
  4, 5,
  5, 7,
  7, 6,
  6, 4, // top
  0, 4,
  1, 5,
  2, 6,
  3, 7, // verticals
]);

const getBoxCorners = (box: BoxCollider): Float32Array => {
  const e = vec3.scale(box.size, 0.5);

  const signs: [number, number, number][] = [
    [-1, -1, -1],
    [1, -1, -1],
    [-1, 1, -1],
    [1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [-1, 1, 1],
    [1, 1, 1],
  ];

  const corners = signs.map(([dx, dy, dz]) =>
    vec3.create(
      box.center[0] + dx * e[0],
      box.center[1] + dy * e[1],
      box.center[2] + dz * e[2]
    )
  );

  const vertexArray = new Float32Array(corners.length * 3);
  for (let i = 0; i < corners.length; i++) {
    vertexArray.set(corners[i], i * 3);
  }

  return vertexArray;
};

export default class ColliderWireframeSystem implements System {
  readonly #query = new EntityQuery([
    ModelComponent,
    TransformComponent,
    ColliderComponent,
  ]);
  readonly #device: GPUDevice;

  constructor(device: GPUDevice) {
    this.#device = device;
  }

  update(_dt: number, em: EntityManager): void {
    const diagnostics = em.getResource(DiagnosticsResource);

    for (const e of this.#query.execute(em)) {
      // todo collider updates
      const collider = em.getComponent(e, ColliderComponent).collider;
      if (!diagnostics.colliderWireframesEnabledDirty) continue;

      if (
        diagnostics.colliderWireframesEnabled &&
        !em.getComponentOpt(e, ColliderWireframeComponent)
      ) {
        const wireframe = new ColliderWireframeComponent();
        em.addComponent(e, wireframe);

        switch (collider.type) {
          case 'box': {
            const corners = getBoxCorners(collider);
            if (!wireframe.vertexBuffer) {
              wireframe.vertexBuffer = this.#device.createBuffer({
                label: 'box collider vertex buffer',
                size: corners.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
              });
              wireframe.lineIndexBuffer = this.#device.createBuffer({
                label: 'box collider line index buffer',
                size: boxLineIndices.byteLength,
                usage: GPUBufferUsage.INDEX,
                mappedAtCreation: true,
              });
              wireframe.lineIndexCount = boxLineIndices.length;

              new Uint16Array(wireframe.lineIndexBuffer.getMappedRange()).set(
                boxLineIndices
              );
              wireframe.lineIndexBuffer.unmap();
            }

            this.#device.queue.writeBuffer(
              wireframe.vertexBuffer,
              0,
              corners.buffer
            );

            break;
          }
        }

        console.log('enable collider wireframe');
      } else {
        em.removeComponent(e, ColliderWireframeComponent);
        console.log('remove collider wireframe');
      }
    }

    diagnostics.colliderWireframesEnabledDirty = false;
  }
}
