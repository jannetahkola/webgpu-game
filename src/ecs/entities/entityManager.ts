import ComponentRegistry from '../components/componentRegistry';

type Instance<I> = I extends new (...args: never[]) => object ? never : I;
type Class<C> = C extends new (...args: never[]) => object ? C : never;
type Constructor<I = object, A extends unknown[] = unknown[]> = new (
  ...args: A
) => I;
type SingletonConstructor<T extends SingletonEntity = SingletonEntity> =
  abstract new () => T & {
    readonly __tag: string;
  };

abstract class SingletonEntity {
  protected __abstractBrand!: void;
}

abstract class Player extends SingletonEntity {
  readonly __tag = 'Player';
}

abstract class Lighting extends SingletonEntity {
  readonly __tag = 'Lighting';
}

abstract class Skybox extends SingletonEntity {
  readonly __tag = 'Skybox';
}

class EntityQuery<C extends object> {
  readonly #componentClasses: Class<C>[];

  constructor(componentClasses: Class<C>[]) {
    this.#componentClasses = componentClasses;
  }

  execute(em: EntityManager): number[] {
    return em.getEntitiesWith(this.#componentClasses);
  }
}

type EntityManagerSnapshot = {
  entities: number[];
  singletonEntities: { tag: string; entity: number }[];
  components: { entity: number; type: string; data: object }[];
};

class EntityManager {
  readonly #entities: number[] = [];
  readonly #components: Map<object, Map<number, object>> = new Map();
  readonly #singletons: Map<object, number> = new Map();
  #next = 0;

  newEntity() {
    const e = this.#next++;
    this.#entities.push(e);
    return {
      entity: e,
      em: this,
      addComponent<T extends object[]>(
        ...componentInstances: { [K in keyof T]: Instance<T[K]> }
      ) {
        componentInstances.forEach((componentInstance) =>
          this.em.addComponent(this.entity, componentInstance)
        );
        return this;
      },
    };
  }

  newSingletonEntity<T extends SingletonEntity>(
    singleton: SingletonConstructor<T>
  ) {
    this.#assertNewSingleton(singleton);
    const e = this.#next++;
    this.#entities.push(e);
    this.#singletons.set(singleton, e);
    return {
      entity: e,
      em: this,
      addComponent<T extends object[]>(
        ...componentInstances: { [K in keyof T]: Instance<T[K]> }
      ) {
        componentInstances.forEach((componentInstance) =>
          this.em.addComponent(this.entity, componentInstance)
        );
        return this;
      },
    };
  }

  hasEntity(entity: number) {
    return this.#entities.includes(entity);
  }

  addComponent<I extends object>(
    entity: number,
    componentInstance: Instance<I>
  ) {
    const componentClass = componentInstance.constructor;
    const map = this.#components.get(componentClass);
    if (!map) this.#components.set(componentClass, new Map());
    this.#components.get(componentClass)!.set(entity, componentInstance);
  }

  getComponent<I extends object, A extends unknown[]>(
    entity: number,
    componentConstructor: Constructor<I, A>
  ) {
    const map = this.#components.get(componentConstructor);
    if (!map) throw new Error('No component ' + componentConstructor.name);
    const component = map.get(entity);
    if (!component)
      throw new Error(
        'No component ' + componentConstructor.name + ' on entity ' + entity
      );
    return component as I;
  }

  getComponentOpt<I extends object, A extends unknown[]>(
    entity: number,
    componentConstructor: Constructor<I, A>
  ) {
    return this.#components.get(componentConstructor)?.get(entity) as
      | I
      | undefined;
  }

  getEntitiesWith<C extends object>(componentClasses: Class<C>[]) {
    return this.#entities.filter((entity) =>
      componentClasses.every(
        (componentClass) =>
          this.#components.get(componentClass)?.has(entity) ?? false
      )
    );
  }

  getSingletonEntity<T extends SingletonEntity>(
    singleton: SingletonConstructor<T>
  ) {
    const entity = this.#singletons.get(singleton);
    if (entity == null) throw new Error('No singleton ' + singleton.name);
    return entity;
  }

  deserialize(snapshot: EntityManagerSnapshot) {
    let next = 0;

    for (const id of snapshot.entities) {
      this.#assertNewEntity(id);
      this.#entities.push(id);
      console.log('restored entity ' + id);
      if (id > next) next = id;
    }

    for (const obj of snapshot.singletonEntities) {
      this.#assertNewEntity(obj.entity);
      this.#entities.push(obj.entity);
      if (obj.entity > next) next = obj.entity;

      let ctor: SingletonConstructor;
      switch (obj.tag) {
        case 'Player':
          ctor = Player;
          break;
        case 'Lighting':
          ctor = Lighting;
          break;
        case 'Skybox':
          ctor = Skybox;
          break;
        default:
          throw new Error(
            'Unknown singleton ' + obj.tag + ' in entity ' + obj.entity
          );
      }
      this.#assertNewSingleton(ctor);
      this.#singletons.set(ctor, obj.entity);
    }

    for (const { entity, type, data: componentData } of snapshot.components) {
      const Component = ComponentRegistry.get(type);
      if (!Component) throw new Error('Unknown component type ' + type);
      const component = new Component(componentData);
      this.addComponent(entity, component);
      console.log('restored component ' + type + ' on entity ' + entity);
    }

    this.#next = next + 1;
  }

  #assertNewSingleton<T extends SingletonEntity>(
    singleton: SingletonConstructor<T>
  ) {
    if (this.#singletons.has(singleton))
      throw new Error('Singleton ' + singleton.name + ' already exists');
  }

  #assertNewEntity(entity: number) {
    if (this.#entities.includes(entity))
      throw new Error('Entity ' + entity + ' already exists');
  }
}

export type { EntityManagerSnapshot, Constructor }; // todo do not export Constructor, or rename to ComponentConstructor
export { EntityQuery, EntityManager, Player, Lighting, Skybox };
