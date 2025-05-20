import { type SingletonEntityTagConstructor } from './singletonEntityTag.ts';

type ComponentConstructor<T extends object = object> = new (
  ...args: never[]
) => T;

class EntityQuery {
  readonly #components: ComponentConstructor[];

  constructor(components: ComponentConstructor[]) {
    this.#components = components;
  }

  execute(em: EntityManager): number[] {
    return em.getEntitiesWith(this.#components);
  }
}

class EntityManager {
  readonly #entities: number[] = [];
  readonly #components: Map<ComponentConstructor, Map<number, object>> =
    new Map();
  readonly #singletons: Map<ComponentConstructor, number> = new Map();

  #nextEntity = 0;

  createEntity() {
    const entity = this.#nextEntity++;
    this.#entities.push(entity);
    return {
      entity,
      em: this,
      addComponent(...components: object[]) {
        components.forEach((component) =>
          this.em.addComponent(this.entity, component)
        );
        return entity;
      },
    };
  }

  createSingletonEntity(tag: ComponentConstructor) {
    if (this.#singletons.has(tag)) {
      throw new Error('Singleton of type ' + tag.name + ' already exists');
    }

    const entity = this.#nextEntity++;
    this.#entities.push(entity);

    this.#singletons.set(tag, entity);
    console.log('created singleton', tag, entity);

    return {
      entity,
      em: this,
      addComponent(...components: object[]) {
        components.forEach((component) => {
          this.em.addComponent(this.entity, component);
        });
      },
    };
  }

  addComponent(entity: number, component: object) {
    const componentClass = component.constructor as ComponentConstructor;
    if (!this.#components.has(componentClass)) {
      this.#components.set(componentClass, new Map());
    }
    this.#components.get(componentClass)?.set(entity, component);
    console.log(
      'added component ' + componentClass.name + ' to entity ' + entity + ''
    );
    return this;
  }

  addSingletonComponent(tag: SingletonEntityTagConstructor, component: object) {
    const entity = this.getSingletonEntity(tag);
    this.addComponent(entity, component);
    return this;
  }

  getComponent<T extends object>(
    entity: number,
    componentClass: ComponentConstructor<T>
  ): T {
    const component = this.#components.get(componentClass)?.get(entity);
    if (!component) {
      throw new Error(
        'Entity ' + entity + ' does not have component ' + componentClass.name
      );
    }
    return component as T;
  }

  getComponentOpt<T extends object>(
    entity: number,
    componentClass: ComponentConstructor<T>
  ): T | undefined {
    const component = this.#components.get(componentClass)?.get(entity);
    return component as T | undefined;
  }

  getEntitiesSnapshot() {
    return this.#entities.slice();
  }

  getEntitiesWith(componentClasses?: ComponentConstructor[]): number[] {
    if (!componentClasses || componentClasses.length === 0) {
      return this.getEntitiesSnapshot();
    }
    return this.#entities.filter((entity) =>
      componentClasses.every(
        (component) => this.#components.get(component)?.has(entity) ?? false
      )
    );
  }

  getSingletonEntity(tag: SingletonEntityTagConstructor) {
    const entity = this.#singletons.get(tag);
    if (entity == null) {
      throw new Error('No singleton of type ' + tag.name);
    }
    return entity;
  }

  getSingletonComponent<T extends object>(
    tag: SingletonEntityTagConstructor,
    componentClass: ComponentConstructor<T>
  ): T {
    const entity = this.getSingletonEntity(tag);
    return this.getComponent(entity, componentClass);
  }
}

export { EntityQuery, EntityManager };
