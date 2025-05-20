const WebGPUStubs = {
  createDevice() {
    const texture = {
      createView: vi.fn(),
      destroy: vi.fn(),
    } as unknown as GPUTexture;

    const buffer = {
      destroy: vi.fn(),
    } as unknown as GPUBuffer;

    const sampler = {} as unknown as GPUSampler;

    const bindGroup = {} as unknown as GPUBindGroup;

    const pass = {
      setPipeline: vi.fn(),
      setBindGroup: vi.fn(),
      setVertexBuffer: vi.fn(),
      setIndexBuffer: vi.fn(),
      draw: vi.fn(),
      drawIndexed: vi.fn(),
      end: vi.fn(),
    } as unknown as GPURenderPassEncoder;

    const encoder = {
      beginRenderPass: vi.fn(() => pass),
      finish: vi.fn(),
    } as unknown as GPUCommandEncoder;

    const device = {
      createTexture: vi.fn(() => texture),
      createBuffer: vi.fn(() => buffer),
      createSampler: vi.fn(() => sampler),
      createShaderModule: vi.fn(),
      createBindGroupLayout: vi.fn(),
      createBindGroup: vi.fn(() => bindGroup),
      createPipelineLayout: vi.fn(),
      createRenderPipeline: vi.fn(() => ({
        getBindGroupLayout: vi.fn(),
      })),
      createCommandEncoder: vi.fn(() => encoder),
      queue: {
        submit: vi.fn(),
        onSubmittedWorkDone: vi.fn(() => Promise.resolve()),
        writeBuffer: vi.fn(),
      },
      limits: {
        maxTextureDimension2D: 8192,
      },
    } as unknown as GPUDevice;

    return { device, texture, buffer, pass, encoder };
  },
};

export { WebGPUStubs };
