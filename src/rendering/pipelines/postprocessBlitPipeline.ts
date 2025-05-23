import code from './postProcessBlit.wgsl?raw';

let module: GPUShaderModule | undefined = undefined;
let pipeline: GPURenderPipeline | undefined = undefined;

export default function postprocessBlitPipeline(
  device: GPUDevice,
  colorFormat: GPUTextureFormat
) {
  module ??= device.createShaderModule({ code });
  pipeline ??= device.createRenderPipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [
        device.createBindGroupLayout({
          entries: [
            {
              // aspect scale
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
      ],
    }),
    vertex: { module },
    fragment: {
      module: module,
      targets: [{ format: colorFormat }],
    },
    multisample: {
      // no multisampling in blit pass
      count: 1,
    },
  });

  return pipeline;
}
