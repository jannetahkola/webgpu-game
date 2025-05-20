const shaderCode = `
@group(0) @binding(0) var<uniform> viewProj: mat4x4f;
@group(0) @binding(1) var<uniform> model: mat4x4f;

struct MaterialUniforms {
  baseColorFactor: vec4f,
}

struct VertexIn {
  @location(0) position: vec3f,
  @location(1) uv: vec2f,
  //@location(2) normal: vec3f,
};

struct VertexOut {
  @builtin(position) position: vec4f,
  @location(1) uv: vec2f,
  //@location(2) normal: vec3f,
};

@vertex fn vs(in: VertexIn) -> VertexOut {
  var output: VertexOut;
  output.position = viewProj * model * vec4f(in.position, 1.0);
  output.uv = in.uv;
  //output.normal = in.normal; //normal * in.normal;
  return output;
}

@group(1) @binding(0) var<uniform> material: MaterialUniforms;
@group(1) @binding(1) var uTexture: texture_2d<f32>;
@group(1) @binding(2) var uSampler: sampler;

//@group(2) @binding(0) var<uniform> lighting: LightingUniforms;

@fragment fn fs(in: VertexOut) -> @location(0) vec4f {
  var baseColor = material.baseColorFactor;
  var textureColor = textureSample(uTexture, uSampler, in.uv);
  return textureColor * baseColor;
}
`;

let module: GPUShaderModule | undefined = undefined;
let pipeline: GPURenderPipeline | undefined = undefined;

export default function litPipeline(
  device: GPUDevice,
  colorFormat: GPUTextureFormat,
  depthFormat: GPUTextureFormat,
  sampleCount: number
) {
  module ??= device.createShaderModule({ code: shaderCode });
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
      ],
    },
    fragment: {
      module: module,
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
