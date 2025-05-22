import CameraSystem from './cameraSystem';
import { WebGPUStubs } from '../../../tests/stubs.ts';
import { EntityManager, Player } from '../entities/entityManager.ts';
import CameraComponent from '../components/cameraComponent.ts';
import TransformComponent from '../components/transformComponent.ts';
import FirstPersonCamera from '../../cameras/firstPersonCamera.ts';

describe('CameraSystem', () => {
  it('creates resources and updates camera', () => {
    const device = WebGPUStubs.createDevice().device;
    const system = new CameraSystem(device);
    const em = new EntityManager();
    const camera = new FirstPersonCamera();
    em.newSingletonEntity(Player).addComponent(
      new CameraComponent({
        cameraType: 'FirstPersonCamera',
        camera,
      }),
      new TransformComponent()
    );

    const cameraUpdateSpy = vi.spyOn(camera, 'update');
    const cameraGetViewProjectionMatrixSpy = vi.spyOn(
      camera,
      'getViewProjectionMatrix'
    );

    system.update(0, em);
    system.update(1, em);

    expect(device.createBuffer).toHaveBeenCalledOnce();
    expect(cameraUpdateSpy).toHaveBeenCalledTimes(2);
    expect(device.queue.writeBuffer).toHaveBeenCalledTimes(2);
    expect(cameraGetViewProjectionMatrixSpy).toHaveBeenCalledTimes(2);
  });
});
