import type { Mat3, Vec3 } from 'wgpu-matrix';

type BoxCollider = {
  type: 'box';
  size: Vec3;
  center: Vec3;
  orientation: Mat3;
};

type MeshCollider = {
  type: 'mesh';
  ref: string;
};

type Collider = BoxCollider | MeshCollider;

export type { Collider, BoxCollider, MeshCollider };
