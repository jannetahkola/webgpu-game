import { mat4 } from 'wgpu-matrix';

export default class SkyboxComponent {
  viewMat = mat4.identity();
  invViewProjMat = mat4.identity();
  invViewProjBuffer?: GPUBuffer;

  getInverseViewProjectionBuffer() {
    if (!this.invViewProjBuffer)
      throw new Error('Inverse view proj buffer not set');
    return this.invViewProjBuffer;
  }
}
