import { EntityManager } from './entityManager';
import { Player } from './singletonEntityTag.ts';

// eslint-disable-next-line vitest/expect-expect
test('singleton types', () => {
  class NotATag {}

  class TestComponent {}

  const em = new EntityManager();

  em.getSingletonEntity(Player);
  em.getSingletonComponent(Player, TestComponent);

  // @ts-expect-error – NotATag is not a singleton tag
  em.getSingletonEntity(NotATag);
  // @ts-expect-error – NotATag is not a singleton tag
  em.getSingletonComponent(NotATag, TestComponent);
});
