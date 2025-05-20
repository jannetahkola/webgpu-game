type Resolution = {
  w: number;
  h: number;
};

type AspectScale = {
  x: number;
  y: number;
};

const ViewportEvents = {
  resolutionChange: 'resolutionchange',
  aspectScaleChange: 'aspectscalechange',
} as const;

type ViewportEvent = (typeof ViewportEvents)[keyof typeof ViewportEvents];

class Viewport {
  readonly #device: GPUDevice;
  readonly #context: GPUCanvasContext;
  readonly #resolution: Resolution;
  readonly #aspectScale: AspectScale = { x: 1, y: 1 };

  #observer?: ResizeObserver;
  #observerEvent?: () => void;

  readonly #eventListeners = new Map<ViewportEvent, (() => void)[]>();
  #aspectScaleChanged = false;
  #resolutionChanged = false;

  constructor({
    device,
    context,
    initialResolution,
  }: {
    device: GPUDevice;
    context: GPUCanvasContext;
    initialResolution: Resolution;
  }) {
    this.#device = device;
    this.#context = context;
    this.#resolution = { ...initialResolution };
    this.#resolutionChanged = true;
  }

  getContext() {
    return this.#context;
  }

  getCanvas() {
    return this.#context.canvas as HTMLCanvasElement;
  }

  getDevicePixelRatio() {
    return window.devicePixelRatio;
  }

  getAspectScale() {
    return this.#aspectScale as Readonly<AspectScale>;
  }

  getAspectRatio() {
    return this.#resolution.w / this.#resolution.h;
  }

  getResolution() {
    return this.#resolution as Readonly<Resolution>;
  }

  setResolution(w: number, h: number) {
    this.#resolution.w = w;
    this.#resolution.h = h;
    this.#resolutionChanged = true;
    this.#updateAspectScale();
  }

  on(event: ViewportEvent, fn: () => void) {
    if (!this.#eventListeners.has(event)) {
      this.#eventListeners.set(event, []);
    }
    this.#eventListeners.get(event)?.push(fn);
  }

  off(event: ViewportEvent, fn: () => void) {
    const array = this.#eventListeners.get(event);
    if (!array) return;
    const index = array.indexOf(fn);
    if (index !== -1) {
      array.splice(index, 1);
    }
  }

  observe() {
    if (this.#observer) return;

    this.#observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      // https://webgpufundamentals.org/webgpu/lessons/webgpu-resizing-the-canvas.html
      for (const entry of entries) {
        const w = entry.devicePixelContentBoxSize[0].inlineSize;
        const h = entry.devicePixelContentBoxSize[0].blockSize;
        const canvas = entry.target as HTMLCanvasElement;

        this.#observerEvent = () => {
          canvas.width = Math.max(
            1,
            Math.min(w, this.#device.limits.maxTextureDimension2D)
          );
          canvas.height = Math.max(
            1,
            Math.min(h, this.#device.limits.maxTextureDimension2D)
          );

          this.#updateAspectScale();
        };
      }
    });

    this.#observer.observe(this.getCanvas(), {
      box: 'device-pixel-content-box',
    });
  }

  update() {
    this.#observerEvent?.();
    this.#observerEvent = undefined;

    if (this.#aspectScaleChanged) {
      this.#aspectScaleChanged = false;
      this.#eventListeners
        .get(ViewportEvents.aspectScaleChange)
        ?.forEach((fn) => fn());
    }

    if (this.#resolutionChanged) {
      this.#resolutionChanged = false;
      this.#eventListeners
        .get(ViewportEvents.resolutionChange)
        ?.forEach((fn) => fn());
    }
  }

  #updateAspectScale() {
    const canvas = this.getCanvas();

    const canvasAspect = canvas.width / canvas.height;
    const renderAspect = this.getAspectRatio();

    const prevX = this.#aspectScale.x;
    const prevY = this.#aspectScale.y;

    if (canvasAspect > renderAspect) {
      // pillarboxing when canvas is wider
      this.#aspectScale.x = renderAspect / canvasAspect;
      this.#aspectScale.y = 1;
    } else {
      // letterboxing when canvas is taller
      this.#aspectScale.x = 1;
      this.#aspectScale.y = canvasAspect / renderAspect;
    }

    if (prevX !== this.#aspectScale.x || prevY !== this.#aspectScale.y) {
      this.#aspectScaleChanged = true;
    }
  }
}

export { Viewport, ViewportEvents };
