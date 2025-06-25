import { vec3, type Vec3 } from 'wgpu-matrix';

export default class RigidBodyComponent {
  grounded: boolean = false;
  velocity: Vec3 = vec3.zero();
}