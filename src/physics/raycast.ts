import { vec3, type Vec3 } from 'wgpu-matrix';

type Ray = {
  origin: Vec3;
  direction: Vec3;
};

type RayHit = {
  t: number;
  normal: Vec3;
};

function getVertex(v: Float32Array, index: number): Vec3 {
  const i = index * 3;
  return vec3.fromValues(v[i], v[i + 1], v[i + 2]);
}

function rayIntersectsTriangle(
  ray: Ray,
  v0: Vec3,
  v1: Vec3,
  v2: Vec3
): number | null {
  const edge1 = vec3.subtract(v1, v0);
  const edge2 = vec3.subtract(v2, v0);
  const h = vec3.cross(ray.direction, edge2);
  const a = vec3.dot(edge1, h);

  if (Math.abs(a) < 1e-6) return null; // parallel

  const f = 1 / a;
  const s = vec3.subtract(ray.origin, v0);
  const u = f * vec3.dot(s, h);
  if (u < 0 || u > 1) return null;

  const q = vec3.cross(s, edge1);
  const v = f * vec3.dot(ray.direction, q);
  if (v < 0 || u + v > 1) return null;

  const t = f * vec3.dot(edge2, q);
  return t >= 0 ? t : null;
}

const Raycast = {
  intersectsMesh(
    ray: Ray,
    vertices: Float32Array,
    indices: Uint32Array | Uint16Array | Uint8Array
  ): RayHit | null {
    let closestT: number | null = null;
    let closestNormal: Vec3 | null = null;

    for (let i = 0; i < indices.length; i += 3) {
      const v0 = getVertex(vertices, indices[i]);
      const v1 = getVertex(vertices, indices[i + 1]);
      const v2 = getVertex(vertices, indices[i + 2]);

      const t = rayIntersectsTriangle(ray, v0, v1, v2);
      if (t != null && (closestT == null || t < closestT)) {
        closestT = t;
        const edge1 = vec3.subtract(v1, v0);
        const edge2 = vec3.subtract(v2, v0);
        const faceNormal = vec3.normalize(vec3.cross(edge1, edge2)); // todo compute or use precomputed ones?
        closestNormal = faceNormal;
      }
    }

    return closestT != null && closestNormal != null
      ? { t: closestT, normal: closestNormal }
      : null;
  },
};

export type { Ray, RayHit };
export { Raycast };
