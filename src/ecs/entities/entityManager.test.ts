import {
  EntityManager,
  type EntityManagerSnapshot,
  Lighting,
  Player,
} from './entityManager';
import { vec3 } from 'wgpu-matrix';
import ComponentRegistry from '../components/componentRegistry.ts';
import ModelComponent from '../components/modelComponent.ts';
import TransformComponent from '../components/transformComponent.ts';

describe('EntityManager', () => {
  class TestComponent {}

  class TestComponent2 {}

  it('creates entities', () => {
    const em = new EntityManager();
    em.newEntity();
    em.newEntity();

    expect(em.hasEntity(0)).toBe(true);
    expect(em.hasEntity(1)).toBe(true);

    const r = em.newEntity();
    expect(r.em).toBe(em);
    expect(r.entity).toBe(2);
  });

  it('creates singleton entities', () => {
    const em = new EntityManager();
    const { entity } = em.newSingletonEntity(Player);

    expect(em.getSingletonEntity(Player)).toBe(entity);
    expect(() => em.newSingletonEntity(Player)).toThrowError(
      'Singleton Player already exists'
    );
  });

  it('adds components and returns entities with components', () => {
    const em = new EntityManager();
    const c1 = new TestComponent();
    const c2 = new TestComponent();
    const { entity: e1 } = em.newEntity().addComponent(c1);
    const { entity: e2 } = em.newEntity().addComponent(c2);

    expect(em.getComponent(e1, TestComponent)).toBe(c1);
    expect(em.getComponent(e2, TestComponent)).toBe(c2);
    expect(em.getEntitiesWith([TestComponent])).toEqual([e1, e2]);
    expect(em.getEntitiesWith([TestComponent2])).toEqual([]);
    expect(em.getEntitiesWith([TestComponent, TestComponent2])).toEqual([]);
  });

  it('adds components and returns singleton entities with components', () => {
    const em = new EntityManager();
    const c1 = new TestComponent();
    const c2 = new TestComponent();
    em.newSingletonEntity(Player).addComponent(c1);
    em.newSingletonEntity(Lighting).addComponent(c2);

    expect(
      em.getComponentOpt(em.getSingletonEntity(Player), TestComponent)
    ).toBe(c1);
    expect(
      em.getComponent(em.getSingletonEntity(Lighting), TestComponent)
    ).toBe(c2);
  });

  it('throws if entity does not have component', () => {
    const em = new EntityManager();

    expect(() => em.getComponent(0, TestComponent)).toThrowError(
      'No component TestComponent'
    );

    em.newEntity().addComponent(new TestComponent());

    expect(() => em.getComponent(1, TestComponent)).toThrowError(
      'No component TestComponent on entity 1'
    );
  });

  it('throws if singleton entity does not have component', () => {
    const em = new EntityManager();
    em.newSingletonEntity(Player);

    expect(() =>
      em.getComponent(em.getSingletonEntity(Player), TestComponent)
    ).toThrowError('No component TestComponent');
  });

  it('throws if singleton entity does not exist', () => {
    const em = new EntityManager();
    expect(() => em.getSingletonEntity(Player)).toThrowError(
      'No singleton Player'
    );
  });

  describe('deserialize', () => {
    beforeEach(() => {
      ComponentRegistry.registerComponents(
        import.meta.glob('../components/*Component.ts', {
          eager: true,
        })
      );
    });

    it('deserializes', () => {
      const snapshot: EntityManagerSnapshot = {
        entities: [0],
        singletonEntities: [{ tag: 'Player', entity: 1 }],
        components: [
          {
            entity: 0,
            type: 'ModelComponent',
            data: {
              ref: './assets/gltf/rubik_cube/rubik_cube.glb',
            },
          },
          {
            entity: 0,
            type: 'TransformComponent',
            data: {
              transform: {
                position: vec3.fromValues(0, 0, -2),
              },
            },
          },
          {
            entity: 1,
            type: 'CameraComponent',
            data: {
              cameraType: 'FirstPersonCamera',
            },
          },
          {
            entity: 1,
            type: 'TransformComponent',
            data: {
              transform: {
                position: vec3.fromValues(0, 1, 0),
              },
            },
          },
        ],
      };
      const em = new EntityManager();
      em.deserialize(snapshot);

      expect(em.hasEntity(0)).toBe(true);
      expect(em.hasEntity(1)).toBe(true);
      expect(em.hasEntity(2)).toBe(false);

      expect(em.getSingletonEntity(Player)).toBe(1);
      expect(
        em.getComponent(em.getSingletonEntity(Player), TransformComponent)
          .transform.position
      ).toEqual(new Float32Array([0, 1, 0]));

      expect(em.getComponent(0, ModelComponent).ref).toBe(
        './assets/gltf/rubik_cube/rubik_cube.glb'
      );
      expect(em.getComponent(0, TransformComponent).transform.position).toEqual(
        new Float32Array([0, 0, -2])
      );

      expect(em.newEntity().entity).toBe(2);
    });

    it('throws if snapshot contains duplicate entities', () => {
      const snapshot: EntityManagerSnapshot = {
        entities: [0, 1, 0],
        singletonEntities: [],
        components: [],
      };
      const em = new EntityManager();

      expect(() => em.deserialize(snapshot)).toThrowError(
        'Entity 0 already exists'
      );
    });

    it('throws if snapshot contains duplicate entities (singletons)', () => {
      const snapshot: EntityManagerSnapshot = {
        entities: [],
        singletonEntities: [
          { tag: 'Player', entity: 1 },
          { tag: 'Lighting', entity: 1 },
        ],
        components: [],
      };
      const em = new EntityManager();

      expect(() => em.deserialize(snapshot)).toThrowError(
        'Entity 1 already exists'
      );
    });

    it('throws if snapshot contains unknown singletons', () => {
      const snapshot: EntityManagerSnapshot = {
        entities: [],
        singletonEntities: [
          { tag: 'Player', entity: 0 },
          { tag: 'Unknown', entity: 1 },
        ],
        components: [],
      };
      const em = new EntityManager();

      expect(() => em.deserialize(snapshot)).toThrowError(
        'Unknown singleton Unknown in entity 1'
      );
    });

    it('throws if snapshot contains duplicate singletons', () => {
      const snapshot: EntityManagerSnapshot = {
        entities: [],
        singletonEntities: [
          { tag: 'Player', entity: 1 },
          { tag: 'Player', entity: 2 },
        ],
        components: [],
      };
      const em = new EntityManager();

      expect(() => em.deserialize(snapshot)).toThrowError(
        'Singleton Player already exists'
      );
    });
  });
});
