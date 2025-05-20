import { EntityManager } from './entityManager';
import { Lighting, Player } from './singletonEntityTag.ts';

describe('EntityManager', () => {
  class TestComponent {}

  class TestComponent2 {}

  it('creates entities', () => {
    const em = new EntityManager();
    em.createEntity();
    em.createEntity();
    expect(em.getEntitiesSnapshot()).toEqual([0, 1]);

    const r = em.createEntity();
    expect(r.em).toBe(em);
    expect(r.entity).toBe(2);
  });

  it('creates singleton entities', () => {
    const em = new EntityManager();
    const { entity } = em.createSingletonEntity(Player);

    expect(em.getSingletonEntity(Player)).toBe(entity);
    expect(() => em.createSingletonEntity(Player)).toThrowError(
      'Singleton of type Player already exists'
    );
  });

  it('adds components and returns entities with components', () => {
    const em = new EntityManager();
    const c1 = new TestComponent();
    const c2 = new TestComponent();
    const e1 = em.createEntity().addComponent(c1);
    const e2 = em.createEntity().addComponent(c2);

    expect(em.getComponent(e1, TestComponent)).toBe(c1);
    expect(em.getComponent(e2, TestComponent)).toBe(c2);
    expect(em.getEntitiesWith([TestComponent])).toEqual([e1, e2]);
    expect(em.getEntitiesWith([TestComponent2])).toEqual([]);
    expect(em.getEntitiesWith([TestComponent, TestComponent2])).toEqual([]);

    const snapshotSpy = vi.spyOn(em, 'getEntitiesSnapshot');

    expect(em.getEntitiesWith()).toEqual([e1, e2]);
    expect(snapshotSpy).toHaveBeenCalledOnce();
  });

  it('adds components and returns singleton entities with components', () => {
    const em = new EntityManager();
    const c1 = new TestComponent();
    const c2 = new TestComponent();
    em.createSingletonEntity(Player).addComponent(c1);
    em.createSingletonEntity(Lighting).addComponent(c2);

    expect(em.getSingletonComponent(Player, TestComponent)).toBe(c1);
    expect(em.getSingletonComponent(Lighting, TestComponent)).toBe(c2);
  });

  it('throws if entity does not have component', () => {
    const em = new EntityManager();

    expect(() => em.getComponent(0, TestComponent)).toThrowError(
      'Entity 0 does not have component TestComponent'
    );
  });

  it('throws if singleton entity does not have component', () => {
    const em = new EntityManager();
    em.createSingletonEntity(Player);

    expect(() => em.getSingletonComponent(Player, TestComponent)).toThrowError(
      'Entity 0 does not have component TestComponent'
    );
  });

  it('throws if singleton entity does not exist', () => {
    const em = new EntityManager();
    expect(() => em.getSingletonEntity(Player)).toThrowError(
      'No singleton of type Player'
    );
    expect(() => em.getSingletonComponent(Player, TestComponent)).toThrowError(
      'No singleton of type Player'
    );
  });
});
