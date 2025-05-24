import code from './skybox.wgsl?raw';

let module: GPUShaderModule | undefined = undefined;
let pipeline: GPURenderPipeline | undefined = undefined;
let currentSampleCount: number = 1;

export default function skyboxPipeline(
  device: GPUDevice,
  colorFormat: GPUTextureFormat,
  depthFormat: GPUTextureFormat,
  sampleCount: number
) {
  if (currentSampleCount !== sampleCount) {
    pipeline = undefined;
    currentSampleCount = sampleCount;
  }
  // todo recreate pipeline on changes
  module ??= device.createShaderModule({ code, label: 'skybox shader module' });
  pipeline ??= device.createRenderPipeline({
    label: 'skybox pipeline',
    layout: device.createPipelineLayout({
      bindGroupLayouts: [
        device.createBindGroupLayout({
          entries: [
            {
              // inverse view projection matrix w/o translation
              binding: 0,
              visibility: GPUShaderStage.FRAGMENT,
              buffer: { type: 'uniform' },
            },
            {
              // texture
              binding: 1,
              visibility: GPUShaderStage.FRAGMENT,
              texture: { viewDimension: 'cube' },
            },
            {
              // sampler
              binding: 2,
              visibility: GPUShaderStage.FRAGMENT,
              sampler: {},
            },
          ],
        }),
      ],
    }),
    vertex: { module },
    fragment: {
      module,
      targets: [{ format: colorFormat }],
    },
    multisample: {
      count: sampleCount,
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less-equal',
      format: depthFormat,
    },
  });

  return pipeline;
}
