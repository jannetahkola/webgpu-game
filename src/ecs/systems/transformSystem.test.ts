import TransformSystem from './transformSystem.ts';
import { WebGPUStubs } from '../../../tests/stubs.ts';
import { EntityManager } from '../entities/entityManager.ts';
import TransformComponent from '../components/transformComponent.ts';
import ParentComponent from '../components/parentComponent.ts';
import ChildComponent from '../components/childComponent.ts';
import { mat4, quat, vec3 } from 'wgpu-matrix';
import type { Transform } from '../../rendering/transform.ts';

const computeTRSMatrix = (transform: Transform) => {
  const modelMatrix = mat4.create();
  mat4.identity(modelMatrix);
  mat4.translate(modelMatrix, transform.position, modelMatrix);
  const rotationMat = mat4.create();
  mat4.fromQuat(transform.rotation, rotationMat);
  mat4.multiply(modelMatrix, rotationMat, modelMatrix);
  mat4.scale(modelMatrix, transform.scale, modelMatrix);
  return modelMatrix;
};

describe('TransformSystem', () => {
  it('creates resources and updates transform', () => {
    const { device } = WebGPUStubs.createDevice();
    const em = new EntityManager();
    const position = vec3.fromValues(0, 0, -2);
    const rotation = quat.fromAxisAngle(vec3.fromValues(0, 1, 0), Math.PI / 2);
    const scale = vec3.fromValues(1, 2, 1);
    const { entity: parent } = em.newEntity().addComponent(
      new TransformComponent({
        transform: {
          position,
          rotation,
          scale,
        },
      }),
      new ChildComponent()
    );
    const { entity: child } = em
      .newEntity()
      .addComponent(new TransformComponent(), new ParentComponent({ parent }));
    em.getComponent(parent, ChildComponent).children.push(child);
    const system = new TransformSystem(device);

    system.update(0, em);
    system.update(1, em);

    expect(device.createBuffer).toHaveBeenCalledTimes(2);

    {
      const transformComponent = em.getComponent(parent, TransformComponent);
      expect(transformComponent.modelMat).toBeFloat32ArrayCloseTo(
        computeTRSMatrix(transformComponent.transform)
      );
    }
    {
      const parentTransformComponent = em.getComponent(
        parent,
        TransformComponent
      );
      const transformComponent = em.getComponent(child, TransformComponent);
      expect(transformComponent.modelMat).toBeFloat32ArrayCloseTo(
        computeTRSMatrix(parentTransformComponent.transform)
      );
    }
  });
});
