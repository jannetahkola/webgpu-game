import type Camera from '../../cameras/camera';

export default class CameraComponent {
  cameraType: string;
  camera?: Camera;

  viewProjBuffer?: GPUBuffer;

  constructor({ cameraType, camera }: { cameraType: string; camera?: Camera }) {
    this.cameraType = cameraType;
    this.camera = camera;
  }

  getCamera() {
    if (!this.camera) throw new Error('Camera not set');
    return this.camera;
  }

  getViewProjectionBuffer() {
    if (!this.viewProjBuffer) throw new Error('View projection buffer not set');
    return this.viewProjBuffer;
  }
}
