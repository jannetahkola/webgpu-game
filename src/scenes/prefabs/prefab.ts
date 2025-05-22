import type { EntityManagerSnapshot } from '../../ecs/entities/entityManager';

export type Prefab = {
  name: string;
  em: EntityManagerSnapshot;
};
