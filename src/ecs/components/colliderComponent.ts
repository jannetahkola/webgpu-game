import type { Collider } from '../../physics/colliders.ts';

export default class ColliderComponent {
  collider: Collider;
  dirty = true;

  constructor({ collider }: { collider: Collider }) {
    this.collider = collider;
  }
}
