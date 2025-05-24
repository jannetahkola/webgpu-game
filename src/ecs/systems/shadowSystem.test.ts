import { WebGPUStubs } from '../../../tests/stubs.ts';
import { EntityManager, Lighting } from '../entities/entityManager.ts';
import LightingComponent from '../components/lightingComponent.ts';
import TransformComponent from '../components/transformComponent.ts';
import { mat4, type Vec3, vec3 } from 'wgpu-matrix';
import ShadowComponent from '../components/shadowComponent.ts';
import ShadowSystem from './shadowSystem.ts';

const computeLightViewProjMatrix = (pos: Vec3, target: Vec3) => {
  const s = 10;
  const view = mat4.lookAt(pos, target, [0, 1, 0]);
  const proj = mat4.ortho(-s, s, -s, s, 0.1, 100);
  return mat4.multiply(proj, view);
};

describe('ShadowSystem', () => {
  it('creates resources and updates shadow', () => {
    const device = WebGPUStubs.createDevice().device;
    const system = new ShadowSystem(device);
    const em = new EntityManager();
    const lightingComponent = new LightingComponent();
    const shadowComponent = new ShadowComponent({ shadowMapSize: 1024 });
    const transformComponent = new TransformComponent({
      transform: { position: vec3.fromValues(5, 10, 5) },
    });
    em.newSingletonEntity(Lighting).addComponent(
      lightingComponent,
      shadowComponent,
      transformComponent
    );

    system.update(0, em);
    system.update(1, em);
    shadowComponent.dirty = true;
    system.update(2, em);

    expect(device.createTexture).toHaveBeenCalledOnce();
    expect(device.createSampler).toHaveBeenCalledOnce();
    expect(device.createBuffer).toHaveBeenCalledTimes(2); // props, vp

    expect(shadowComponent.dirty).toBe(false);
    expect(shadowComponent.bufferArray[0]).toBeCloseTo(
      shadowComponent.shadowMapSize,
      4
    );
    expect(shadowComponent.viewProjMat).toBeFloat32ArrayCloseTo(
      computeLightViewProjMatrix(
        transformComponent.transform.position,
        lightingComponent.target
      )
    );
    expect(() => shadowComponent.getBuffer()).not.toThrow();
    expect(() => shadowComponent.getViewProjectionBuffer()).not.toThrow();
    expect(() => shadowComponent.getDepthTexture()).not.toThrow();
    expect(() => shadowComponent.getDepthTextureSampler()).not.toThrow();
  });
});
