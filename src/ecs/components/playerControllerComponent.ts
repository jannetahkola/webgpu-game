import { vec2, vec3 } from 'wgpu-matrix';

export default class PlayerControllerComponent {
  moveSpeed = 3;
  rotationSpeed = 0.3;
  moveDir = vec3.create();
  lookDelta = vec2.create();
  yaw = 0;
  pitch = 0;
  flyModeEnabled = false;
}
