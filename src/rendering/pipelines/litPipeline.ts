import code from './lit.wgsl?raw';

let module: GPUShaderModule | undefined = undefined;
let pipeline: GPURenderPipeline | undefined = undefined;
let currentSampleCount: number = 1;

export default function litPipeline(
  device: GPUDevice,
  colorFormat: GPUTextureFormat,
  depthFormat: GPUTextureFormat,
  sampleCount: number
) {
  if (currentSampleCount !== sampleCount) {
    pipeline = undefined;
    currentSampleCount = sampleCount;
  }
  module ??= device.createShaderModule({ code, label: 'lit shader module' });
  pipeline ??= device.createRenderPipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [
        device.createBindGroupLayout({
          entries: [
            {
              // view projection matrix
              binding: 0,
              visibility: GPUShaderStage.VERTEX,
              buffer: { type: 'uniform' },
            },
            {
              // todo combine these or not?
              // model matrix
              binding: 1,
              visibility: GPUShaderStage.VERTEX,
              buffer: { type: 'uniform' },
            },
            {
              // normal matrix
              binding: 2,
              visibility: GPUShaderStage.VERTEX,
              buffer: { type: 'uniform' },
            },
          ],
        }),
        device.createBindGroupLayout({
          entries: [
            {
              // material properties
              binding: 0,
              visibility: GPUShaderStage.FRAGMENT,
              buffer: { type: 'uniform' },
            },
            {
              // texture
              binding: 1,
              visibility: GPUShaderStage.FRAGMENT,
              texture: {},
            },
            {
              // sampler
              binding: 2,
              visibility: GPUShaderStage.FRAGMENT,
              sampler: {},
            },
          ],
        }),
        device.createBindGroupLayout({
          entries: [
            {
              // lighting properties
              binding: 0,
              visibility: GPUShaderStage.FRAGMENT,
              buffer: { type: 'uniform' },
            },
          ],
        }),
      ],
    }),
    vertex: {
      module,
      buffers: [
        // todo interleaved buffers?
        {
          arrayStride: 12,
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' }, // position
          ],
        },
        {
          arrayStride: 8,
          attributes: [
            { shaderLocation: 1, offset: 0, format: 'float32x2' }, // uv
          ],
        },
        {
          arrayStride: 12,
          attributes: [
            { shaderLocation: 2, offset: 0, format: 'float32x3' }, // normal
          ],
        },
      ],
    },
    fragment: {
      module,
      targets: [{ format: colorFormat }],
    },
    primitive: {
      cullMode: 'back',
    },
    multisample: {
      count: sampleCount,
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: depthFormat,
    },
  });

  return pipeline;
}
