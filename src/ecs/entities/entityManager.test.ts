import { EntityManager, Lighting, Player } from './entityManager';

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
      'No singleton Player, singletons: '
    );
  });
});
