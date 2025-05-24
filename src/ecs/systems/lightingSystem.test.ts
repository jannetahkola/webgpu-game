import { WebGPUStubs } from '../../../tests/stubs';
import { EntityManager, Lighting } from '../entities/entityManager';
import LightingSystem from './lightingSystem';
import LightingComponent from '../components/lightingComponent.ts';
import TransformComponent from '../components/transformComponent.ts';
import { vec3, type Vec3 } from 'wgpu-matrix';

const computeLightDirection = (pos: Vec3, target: Vec3) => {
  const dir = vec3.create();
  vec3.subtract(pos, target, dir);
  vec3.normalize(dir, dir);
  return dir;
};

describe('LightingSystem', () => {
  it('creates resources and updates lighting', () => {
    const device = WebGPUStubs.createDevice().device;
    const system = new LightingSystem(device);
    const em = new EntityManager();
    const lightingComponent = new LightingComponent();
    const transformComponent = new TransformComponent({
      transform: { position: vec3.fromValues(5, 10, 5) },
    });
    em.newSingletonEntity(Lighting).addComponent(
      lightingComponent,
      transformComponent
    );

    system.update(0, em);
    system.update(1, em);
    lightingComponent.dirty = true;
    system.update(2, em);

    const dir = computeLightDirection(
      transformComponent.transform.position,
      lightingComponent.target
    );

    expect(lightingComponent.dirty).toBe(false);
    expect(lightingComponent.direction).toBeFloat32ArrayCloseTo(dir);
    expect(lightingComponent.bufferArray[0]).toBeCloseTo(dir[0], 4);
    expect(lightingComponent.bufferArray[1]).toBeCloseTo(dir[1], 4);
    expect(lightingComponent.bufferArray[2]).toBeCloseTo(dir[2], 4);
    expect(lightingComponent.bufferArray[3]).toBeCloseTo(
      lightingComponent.intensity,
      4
    );
    expect(lightingComponent.bufferArray[4]).toBeCloseTo(
      lightingComponent.diffuseBias,
      4
    );
    expect(lightingComponent.bufferArray[5]).toBeCloseTo(
      lightingComponent.ambient,
      4
    );
    expect(device.createBuffer).toHaveBeenCalledTimes(1);
    expect(device.queue.writeBuffer).toHaveBeenCalledTimes(2); // dirty twice
  });
});
