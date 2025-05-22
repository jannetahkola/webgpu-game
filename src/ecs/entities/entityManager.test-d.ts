import { EntityManager, EntityQuery, Player } from './entityManager';

class TestComponent {}

class TestComponent2 {
  x: number;

  constructor(x: number) {
    this.x = x;
  }
}

class TestComponent3 {
  x: object;

  constructor(x: object) {
    this.x = x;
  }
}

test('EntityManager types', () => {
  const em = new EntityManager();
  const { entity: e } = em.newEntity();

  em.addComponent(e, new TestComponent());
  em.addComponent(e, new TestComponent2(0));
  // @ts-expect-error - Not an instance
  em.addComponent(e, TestComponent);
  // @ts-expect-error - Not an instance
  em.addComponent(e, TestComponent2);

  em.newEntity().addComponent(new TestComponent());
  em.newEntity().addComponent(new TestComponent2(0));
  em.newEntity().addComponent(new TestComponent(), new TestComponent2(0));
  em.newEntity().addComponent(new TestComponent2(0), new TestComponent());
  em.newEntity().addComponent(new TestComponent3({}), new TestComponent2(0));
  em.newEntity().addComponent(new TestComponent2(0), new TestComponent3({}));
  // @ts-expect-error - Not an instance
  em.newEntity().addComponent(TestComponent);
  // @ts-expect-error - Not an instance
  em.newEntity().addComponent(TestComponent2);
  // @ts-expect-error - Not an instance
  em.newEntity().addComponent(TestComponent, TestComponent2);

  const t1 = em.getComponent(e, TestComponent);
  assertType<TestComponent>(t1);
  expect(t1).instanceOf(TestComponent);
  const t2 = em.getComponent(e, TestComponent2);
  assertType<TestComponent2>(t2);
  expect(t2).instanceOf(TestComponent2);
  assertType<number>(t2.x);
  // @ts-expect-error - Not a class
  em.getComponent(e, new TestComponent());
  // @ts-expect-error - Not a class
  em.getComponent(e, new TestComponent2(2));

  const to1 = em.getComponentOpt(e, TestComponent);
  assertType<TestComponent | undefined>(to1);
  expect(to1).instanceOf(TestComponent);
  const to2 = em.getComponentOpt(e, TestComponent2);
  assertType<TestComponent2 | undefined>(to2);
  expect(to2).instanceOf(TestComponent2);
  // @ts-expect-error - Not a class
  em.getComponentOpt(e, new TestComponent());
  // @ts-expect-error - Not a class
  em.getComponentOpt(e, new TestComponent2(2));

  assertType<number[]>(em.getEntitiesWith([TestComponent]));
  assertType<number[]>(em.getEntitiesWith([TestComponent2]));
  // @ts-expect-error - Not a class
  em.getEntitiesWith([new TestComponent()]);
  // @ts-expect-error - Not a class
  em.getEntitiesWith([new TestComponent2()]);

  const { entity: singletonEntity } = em.newSingletonEntity(Player);
  assertType<number>(singletonEntity);
  // @ts-expect-error - Not a class
  em.newSingletonEntity(new Player());
  // @ts-expect-error - Not a singleton
  em.newSingletonEntity(TestComponent);

  assertType<number>(em.getSingletonEntity(Player));
  // @ts-expect-error - Not a class
  em.getSingletonEntity(new Player());
  // @ts-expect-error - Not a singleton
  em.getSingletonEntity(TestComponent);
  // @ts-expect-error - Not a singleton
  em.getSingletonEntity(Playerr);
});

test('EntityQuery types', () => {
  const em = new EntityManager();
  const { entity: e } = em.newEntity();
  em.addComponent(e, new TestComponent());
  em.addComponent(e, new TestComponent2(0));

  const q = new EntityQuery([TestComponent, TestComponent2]);
  assertType<EntityQuery<typeof TestComponent | typeof TestComponent2>>(q);
  expect(q.execute(em)).toEqual([0, 1]);

  // @ts-expect-error - Not a class
  new EntityQuery([new TestComponent()]);
});
