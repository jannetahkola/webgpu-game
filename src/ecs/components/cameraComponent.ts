import type Camera from '../../cameras/camera';

export default class CameraComponent {
  camera: Camera;

  viewProjBuffer?: GPUBuffer;

  getViewProjectionBuffer() {
    if (!this.viewProjBuffer) throw new Error('View projection buffer not set');
    return this.viewProjBuffer;
  }

  constructor(camera: Camera) {
    this.camera = camera;
  }
}
