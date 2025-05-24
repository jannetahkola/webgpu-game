import code from './shadow.wgsl?raw';

let module: GPUShaderModule | undefined = undefined;
let pipeline: GPURenderPipeline | undefined = undefined;

export default function shadowPipeline(
  device: GPUDevice,
  depthFormat: GPUTextureFormat
) {
  module ??= device.createShaderModule({ code, label: 'shadow shader module' });
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
    primitive: {
      cullMode: 'front',
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: depthFormat,
    },
  });

  return pipeline;
}
