import type { EntityManager } from '../entities/entityManager';

export default interface System {
  update(dt: number, em: EntityManager): void;
}
