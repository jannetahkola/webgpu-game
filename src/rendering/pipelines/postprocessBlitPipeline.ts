const shaderCode = `
struct VertexOut {
  @builtin(position) position: vec4f,
  @location(1) uv: vec2f,
};

@vertex fn vs(@builtin(vertex_index) index: u32) -> VertexOut {
  var pos = array(
    vec2f(-1,  3),
    vec2f(-1, -1),
    vec2f( 3, -1)
  );
  var out: VertexOut;
  out.position = vec4f(pos[index], 0, 1);
  out.uv = (pos[index] + vec2f(1)) * .5;
  return out;
}

@group(0) @binding(0) var<uniform> scale: vec2f;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;

@fragment fn fs(in: VertexOut) -> @location(0) vec4f {
  var uv = in.uv;
  uv.y = 1 - uv.y; // flip y
  let centeredUV = (uv - vec2f(.5)) / scale + vec2f(.5);
  let isInside = all(centeredUV >= vec2f(.0)) && all(centeredUV <= vec2f(1));

  let txColor = textureSample(uTexture, uSampler, centeredUV);
  let boxColor = vec4f(0);

  return select(boxColor, txColor, isInside);
}
`;

let module: GPUShaderModule | undefined = undefined;
let pipeline: GPURenderPipeline | undefined = undefined;

export default function postprocessBlitPipeline(
  device: GPUDevice,
  colorFormat: GPUTextureFormat
) {
  module ??= device.createShaderModule({ code: shaderCode });
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
