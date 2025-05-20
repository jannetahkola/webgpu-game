class SingletonEntityTag {
  protected readonly __singletonTag!: void;
}

type SingletonEntityTagConstructor<T = SingletonEntityTag> = new () => T;

class Player extends SingletonEntityTag {}

class Lighting extends SingletonEntityTag {}

export type { SingletonEntityTagConstructor };
export { Player, Lighting };
