@group(0) @binding(0) var<uniform> viewProjMat: mat4x4f;
@group(0) @binding(1) var<uniform> modelMat: mat4x4f;
@group(0) @binding(2) var<uniform> normalMat: mat3x3f;

@group(1) @binding(0) var<uniform> material: MaterialUniforms;
@group(1) @binding(1) var materialTexture: texture_2d<f32>;
@group(1) @binding(2) var materialSampler: sampler;

@group(2) @binding(0) var<uniform> lighting: LightingUniforms;

@group(3) @binding(0) var<uniform> shadow: ShadowUniforms;
@group(3) @binding(1) var shadowMap : texture_depth_2d;
@group(3) @binding(2) var shadowSampler : sampler_comparison;
@group(3) @binding(3) var<uniform> lightViewProjMat : mat4x4f;

struct MaterialUniforms {
  baseColorFactor: vec4f,
}

struct LightingUniforms {
  direction: vec3f, // normalized direction
  intensity: f32, // brightness multiplier
  diffuseBias: f32, // minimum diffuse
  ambient: f32, // additional ambient light
}

struct ShadowUniforms {
  shadowMapSize: f32,
}

struct VertexIn {
  @location(0) position: vec3f,
  @location(1) uv: vec2f,
  @location(2) normal: vec3f,
};

struct VertexOut {
  @builtin(position) position: vec4f,
  @location(0) fragPos: vec3f,
  @location(1) uv: vec2f,
  @location(2) normal: vec3f,
  @location(3) shadowPos: vec4f,
};

@vertex fn vs(in: VertexIn) -> VertexOut {
  let worldPos = modelMat * vec4f(in.position, 1);
  var posFromLight = lightViewProjMat * worldPos;
  posFromLight.x = posFromLight.x * .5 + .5; // convert xy to [0, 1]
  posFromLight.y = posFromLight.y * .5 + .5;
  posFromLight.y = 1 - posFromLight.y; // flip y

  var output: VertexOut;
  output.position = viewProjMat * worldPos;
  output.fragPos = output.position.xyz;
  output.uv = in.uv;
  output.normal = normalMat * in.normal;
  output.shadowPos = posFromLight;
  return output;
}

@fragment fn fs(in: VertexOut) -> @location(0) vec4f {
  let direction = lighting.direction;
  let intensity = lighting.intensity;
  let diffuseBias = lighting.diffuseBias;
  let ambient = lighting.ambient;

  let diffuse = max(dot(normalize(in.normal), direction), 0);
  let diffuseLight = diffuse * intensity + diffuseBias;

  var visibility = .0;
  let oneOverShadowDepthTextureSize = 1.0 / shadow.shadowMapSize;
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      let offset = vec2f(vec2(x, y)) * oneOverShadowDepthTextureSize;
      visibility += textureSampleCompare(
        shadowMap, shadowSampler,
        in.shadowPos.xy + offset, in.shadowPos.z
      );
    }
  }
  visibility /= 9;

  let shadowStrength = .5; // todo pass in a buffer
  let shadowFactor = mix(1 - shadowStrength, 1, visibility);

  let baseColor = material.baseColorFactor;
  let textureColor = textureSample(materialTexture, materialSampler, in.uv);
  let color = textureColor * baseColor;

  return color * ((diffuseLight * shadowFactor) + ambient);
}

//@fragment fn fs(in: VertexOut) -> @location(0) vec4f {
//  // debug -- visualize normals
//  return vec4f(normalize(in.normal) * .5 + .5, 1);
//}

//@fragment fn fs(in: VertexOut) -> @location(0) vec4f {
//  // debug -- visualize uvs
//  let shadowCoord = in.shadowPos.xyz / in.shadowPos.w;
//  return vec4f(shadowCoord, 1);
//}

//@fragment fn fs(in: VertexOut) -> @location(0) vec4f {
//  // debug -- visualize shadows in grayscale
//  let shadowCoord = in.shadowPos.xyz / in.shadowPos.w;
//  let uv = shadowCoord.xy;
//  let depth: f32 = textureLoad(shadowMap, vec2<i32>(uv * vec2f(1024)), 0);
//  return vec4f(depth, depth, depth, 1);
//}