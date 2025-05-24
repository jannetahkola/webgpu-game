import SkyboxSystem from './skyboxSystem.ts';
import { WebGPUStubs } from '../../../tests/stubs.ts';
import { EntityManager, Player, Skybox } from '../entities/entityManager.ts';
import CameraComponent from '../components/cameraComponent.ts';
import FirstPersonCamera from '../../cameras/firstPersonCamera.ts';
import SkyboxComponent from '../components/skyboxComponent.ts';
import { type Mat4, mat4 } from 'wgpu-matrix';

const computeInverseViewProjectionMatrix = (viewSrc: Mat4, proj: Mat4) => {
  const view = mat4.copy(viewSrc);

  view[12] = 0;
  view[13] = 0;
  view[14] = 0;

  const invVp = mat4.identity();
  mat4.multiply(proj, view, invVp);
  mat4.inverse(invVp, invVp);
  return invVp;
};

describe('SkyboxSystem', () => {
  it('creates resources and updates skybox', () => {
    const { device } = WebGPUStubs.createDevice();

    const em = new EntityManager();
    const camera = new FirstPersonCamera();
    em.newSingletonEntity(Player).addComponent(
      new CameraComponent({
        cameraType: 'FirstPersonCamera',
        camera,
      })
    );
    const skyboxComponent = new SkyboxComponent();
    em.newSingletonEntity(Skybox).addComponent(skyboxComponent);

    const system = new SkyboxSystem(device);

    system.update(0, em);
    system.update(1, em);

    expect(skyboxComponent.invViewProjMat).toBeFloat32ArrayCloseTo(
      computeInverseViewProjectionMatrix(
        camera.getViewMatrix(),
        camera.getProjectionMatrix()
      )
    );
    expect(device.createBuffer).toHaveBeenCalledOnce();
    expect(device.queue.writeBuffer).toHaveBeenCalledTimes(2);

    // todo test with different camera matrices
  });
});
