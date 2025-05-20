import PostProcessRenderer from './postprocessRenderer.ts';
import { WebGPUStubs } from '../../../tests/stubs.ts';

describe('PostProcessRenderer', () => {
  describe('toCanvas', () => {
    it('creates resources and draws', () => {
      const { device, texture, pass, encoder } = WebGPUStubs.createDevice();
      const renderer = new PostProcessRenderer();

      renderer.toCanvas(device, encoder, texture, texture);
      renderer.toCanvas(device, encoder, texture, texture);

      expect(device.createBuffer).toHaveBeenCalledOnce();
      expect(device.createSampler).toHaveBeenCalledOnce();
      expect(device.createBindGroup).toHaveBeenCalledOnce();
      expect(pass.draw).toHaveBeenCalledWith(3);
      expect(pass.draw).toHaveBeenCalledTimes(2);
      expect(pass.end).toHaveBeenCalledTimes(2);
    });

    it('recreates bind group and draws when textures destroyed', () => {
      const { device, texture, pass, encoder } = WebGPUStubs.createDevice();
      const renderer = new PostProcessRenderer();

      renderer.toCanvas(device, encoder, texture, texture);
      renderer.onTexturesDestroyed();
      renderer.toCanvas(device, encoder, texture, texture);

      expect(device.createBuffer).toHaveBeenCalledOnce();
      expect(device.createSampler).toHaveBeenCalledOnce();
      expect(device.createBindGroup).toHaveBeenCalledTimes(2);
      expect(pass.draw).toHaveBeenCalledWith(3);
      expect(pass.draw).toHaveBeenCalledTimes(2);
      expect(pass.end).toHaveBeenCalledTimes(2);
    });
  });

  // todo aspect scale change
  // todo check correct pipeline created (factory again?)
});
