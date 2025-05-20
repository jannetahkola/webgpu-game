import { Viewport, ViewportEvents } from './viewport.ts';
import { WebGPUStubs } from '../../tests/stubs.ts';
import { GlobalWindow } from 'happy-dom';

describe('Viewport', () => {
  it('observes ResizeObserver events and applies changes when update() called', () => {
    const window = new GlobalWindow() as unknown as Window;
    const canvas = window.document.createElement('canvas');
    canvas.width = 0;
    canvas.height = 0;

    const { device } = WebGPUStubs.createDevice();
    const context = { canvas } as GPUCanvasContext;
    const viewport = new Viewport({
      device,
      context,
      initialResolution: { w: 1280, h: 720 },
    });
    const resolutionChangeListener = vi.fn();
    const aspectScaleChangeListener = vi.fn();
    viewport.on(ViewportEvents.resolutionChange, resolutionChangeListener);
    viewport.on(ViewportEvents.aspectScaleChange, aspectScaleChangeListener);

    let resizeCallback!: ResizeObserverCallback;
    const observe = vi.fn();
    const ResizeObserverMock = vi.fn((cb: ResizeObserverCallback) => {
      resizeCallback = cb;
      return { observe, unobserve: vi.fn(), disconnect: vi.fn() };
    });
    window.ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;

    viewport.observe(window);
    expect(observe).toHaveBeenCalledOnce();

    viewport.update();

    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
    expect(resolutionChangeListener).toHaveBeenCalledOnce();
    expect(aspectScaleChangeListener).not.toHaveBeenCalled();
    expect(viewport.getAspectScale()).toEqual({ x: 1, y: 1 });
    expect(viewport.getResolution()).toEqual({ w: 1280, h: 720 });

    vi.resetAllMocks();
    resizeCallback(
      [
        {
          target: context.canvas as HTMLCanvasElement,
          devicePixelContentBoxSize: [
            {
              blockSize: 1024,
              inlineSize: 1280,
            },
          ] satisfies ResizeObserverSize[],
        } as unknown as ResizeObserverEntry,
      ],
      {} as ResizeObserver
    );
    viewport.update();

    expect(canvas.width).toBe(1280);
    expect(canvas.height).toBe(1024);
    expect(resolutionChangeListener).not.toHaveBeenCalled();
    expect(aspectScaleChangeListener).toHaveBeenCalledOnce();
    expect(viewport.getAspectScale().x).toBe(1);
    expect(viewport.getAspectScale().y).toBeCloseTo(0.7, 2);
    expect(viewport.getResolution()).toEqual({ w: 1280, h: 720 });
  });
});
