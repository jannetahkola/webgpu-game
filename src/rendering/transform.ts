import type { Quat, Vec3 } from 'wgpu-matrix';

export type Transform = {
  position: Vec3;
  rotation: Quat;
  scale: Vec3;
};
