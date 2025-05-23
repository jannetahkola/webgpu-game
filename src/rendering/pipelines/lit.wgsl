@group(0) @binding(0) var<uniform> viewProjMat: mat4x4f;
@group(0) @binding(1) var<uniform> modelMat: mat4x4f;
@group(0) @binding(2) var<uniform> normalMat: mat3x3f;

struct MaterialUniforms {
  baseColorFactor: vec4f,
}

struct LightingUniforms {
  direction: vec3f, // normalized direction
  intensity: f32, // brightness multiplier
  diffuseBias: f32, // minimum diffuse
}

struct VertexIn {
  @location(0) position: vec3f,
  @location(1) uv: vec2f,
  @location(2) normal: vec3f,
};

struct VertexOut {
  @builtin(position) position: vec4f,
  @location(1) uv: vec2f,
  @location(2) normal: vec3f,
};

@vertex fn vs(in: VertexIn) -> VertexOut {
  var output: VertexOut;
  output.position = viewProjMat * modelMat * vec4f(in.position, 1.0);
  output.uv = in.uv;
  output.normal = normalMat * in.normal;
  return output;
}

@group(1) @binding(0) var<uniform> material: MaterialUniforms;
@group(1) @binding(1) var uTexture: texture_2d<f32>;
@group(1) @binding(2) var uSampler: sampler;

@group(2) @binding(0) var<uniform> lighting: LightingUniforms;

@fragment fn fs(in: VertexOut) -> @location(0) vec4f {
  var direction = lighting.direction;
  var intensity = lighting.intensity;
  var diffuseBias = lighting.diffuseBias;
  var diffuse = max(dot(normalize(in.normal), direction), 0);
  var diffuseLight = diffuse * intensity + diffuseBias;

  var baseColor = material.baseColorFactor;
  var textureColor = textureSample(uTexture, uSampler, in.uv);

  return textureColor * baseColor * diffuseLight;
}

// debug -- visualize normals
//@fragment fn fs(in: VertexOut) -> @location(0) vec4f {
//  return vec4f(normalize(in.normal) * 0.5 + 0.5, 1.0);
//}