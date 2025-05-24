import type { Mat3, Vec3 } from 'wgpu-matrix';

type BoxCollider = {
  type: 'box';
  size: Vec3;
  center: Vec3;
  orientation: Mat3;
};

type Collider = BoxCollider;

export type { Collider, BoxCollider };
