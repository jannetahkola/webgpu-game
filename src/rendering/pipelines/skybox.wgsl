// source: https://webgpufundamentals.org/webgpu/lessons/webgpu-skybox.html

struct VertexOut {
  @builtin(position) position: vec4f,
  @location(0) pos: vec4f,
};

@vertex fn vs(@builtin(vertex_index) index: u32) -> VertexOut {
  var pos = array(
    vec2f(-1,  3),
    vec2f(-1, -1),
    vec2f( 3, -1)
  );
  var out: VertexOut;
  out.position = vec4f(pos[index], 1, 1);
  out.pos = out.position;
  return out;
}

@group(0) @binding(0) var<uniform> viewProjInv: mat4x4f;
@group(0) @binding(1) var uTexture: texture_cube<f32>;
@group(0) @binding(2) var uSampler: sampler;

@fragment fn fs(in: VertexOut) -> @location(0) vec4f {
  let t = viewProjInv * in.pos;
  return textureSample(
    uTexture, uSampler,
    normalize(t.xyz / t.w) * vec3f(1, 1, -1)
  );
}
