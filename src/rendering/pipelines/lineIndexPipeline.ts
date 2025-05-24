import code from './lineIndex.wgsl?raw';

let module: GPUShaderModule | undefined = undefined;
let pipeline: GPURenderPipeline | undefined = undefined;
let currentSampleCount: number = 1;

export default function lineIndexPipeline(
  device: GPUDevice,
  colorFormat: GPUTextureFormat,
  depthFormat: GPUTextureFormat,
  sampleCount: number
) {
  if (currentSampleCount !== sampleCount) {
    pipeline = undefined;
    currentSampleCount = sampleCount;
  }
  module ??= device.createShaderModule({
    code,
    label: 'line index shader module',
  });
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
              // model matrix
              binding: 1,
              visibility: GPUShaderStage.VERTEX,
              buffer: { type: 'uniform' },
            },
          ],
        }),
      ],
    }),
    vertex: {
      module,
      buffers: [
        {
          arrayStride: 12,
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' }, // position
          ],
        },
      ],
    },
    fragment: {
      module,
      targets: [{ format: colorFormat }],
    },
    primitive: {
      topology: 'line-list',
      cullMode: 'back',
    },
    multisample: {
      count: sampleCount,
    },
    depthStencil: {
      depthWriteEnabled: false,
      depthCompare: 'less-equal',
      format: depthFormat,
    },
  });

  return pipeline;
}
