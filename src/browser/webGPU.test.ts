import requestWebGPU from './webGPU.ts';
import { GlobalWindow } from 'happy-dom';

describe('requestWebGPU', () => {
  let window: Window;

  beforeEach(() => {
    window = new GlobalWindow() as unknown as Window;
  });

  it('throws if `navigator.gpu` = undefined', async () => {
    const canvas = window.document.createElement('canvas');
    await expect(requestWebGPU(window, canvas)).rejects.toThrowError(
      'WebGPU API not available - `navigator.gpu` = undefined'
    );
  });

  it('throws if cannot get device', async () => {
    Object.defineProperty(window.navigator, 'gpu', {
      value: {
        requestAdapter: () => Promise.resolve(),
      },
    });
    const canvas = window.document.createElement('canvas');
    await expect(requestWebGPU(window, canvas)).rejects.toThrowError(
      'WebGPU API not available - `device` = undefined'
    );
  });

  it('throws if cannot get context', async () => {
    Object.defineProperty(window.navigator, 'gpu', {
      value: {
        requestAdapter: () =>
          Promise.resolve({
            requestDevice: () => Promise.resolve({}),
          }),
      },
    });
    const canvas = window.document.createElement('canvas');
    await expect(requestWebGPU(window, canvas)).rejects.toThrowError(
      'WebGPU API not available - `context` = undefined'
    );
  });

  it('returns device and context', async () => {
    const getPreferredCanvasFormat = vi.fn().mockReturnValue('rgba8unorm');
    const configure = vi.fn();
    Object.defineProperty(window.navigator, 'gpu', {
      value: {
        requestAdapter: () =>
          Promise.resolve({
            requestDevice: () => Promise.resolve({}),
          }),
        getPreferredCanvasFormat,
      },
    });
    const canvas = window.document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue({
      configure,
    } as unknown as GPUCanvasContext);
    const { device, context } = await requestWebGPU(window, canvas);
    expect(device).not.toBeUndefined();
    expect(context).not.toBeUndefined();
    expect(getPreferredCanvasFormat).toHaveBeenCalledOnce();
    expect(configure).toHaveBeenCalledOnce();
  });
});
