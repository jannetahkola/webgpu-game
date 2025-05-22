import { EntityManager } from '../ecs/entities/entityManager.ts';
import type System from '../ecs/systems/system.ts';

export default class Scene {
  readonly name: string;
  readonly em = new EntityManager();
  readonly systems: System[] = [];

  constructor(name: string) {
    this.name = name;
  }

  update(dt: number): void {
    this.systems.forEach((system) => system.update(dt, this.em));
  }
}
