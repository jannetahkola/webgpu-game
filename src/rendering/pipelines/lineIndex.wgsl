@group(0) @binding(0) var<uniform> viewProjMat: mat4x4f;
@group(0) @binding(1) var<uniform> modelMat: mat4x4f;

struct VertexIn {
  @location(0) position: vec3f,
}

struct VertexOut {
  @builtin(position) position: vec4f,
}

@vertex fn vs(in: VertexIn) -> VertexOut {
  var out: VertexOut;
  out.position = viewProjMat * modelMat * vec4f(in.position, 1);
  return out;
}

@fragment fn fs(in: VertexOut) -> @location(0) vec4f {
  return vec4f(0, 1, 0, 1);
}