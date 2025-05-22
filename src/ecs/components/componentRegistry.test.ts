import ComponentRegistry from './componentRegistry';

class TestComponent3 {
  x: { y: number };

  constructor(x: { y: number }) {
    this.x = x;
  }
}

const modules: Record<string, unknown> = {
  './testComponent.ts': {
    TestComponent: class TestComponent {
      constructor() {}
    },
  },
  './testComponent2.ts': {
    TestComponent2: class TestComponent2 {
      x: number;

      constructor(x: number) {
        this.x = x;
      }
    },
  },
  './testComponent3.ts': {
    TestComponent3: TestComponent3,
  },
};

describe('ComponentRegistry', () => {
  it('registers components and returns constructors', () => {
    ComponentRegistry.registerComponents(modules);

    const Ctor1 = ComponentRegistry.get('TestComponent');
    expect(Ctor1.name).toStrictEqual('TestComponent');
    expect(Ctor1).not.toStrictEqual(Object);
    const i1 = new Ctor1();
    expect(i1).toBeInstanceOf(Ctor1);
    expect(i1).not.toBeInstanceOf(TestComponent3);

    const Ctor2 = ComponentRegistry.get('TestComponent2');
    expect(Ctor2.name).toStrictEqual('TestComponent2');
    expect(Ctor2).not.toStrictEqual(Object);
    const i2 = new Ctor2();
    expect(i2).toBeInstanceOf(Ctor2);
    expect(i2).not.toBeInstanceOf(TestComponent3);

    const Ctor3 = ComponentRegistry.get('TestComponent3');
    expect(Ctor3.name).toStrictEqual('TestComponent3');
    expect(Ctor3).not.toStrictEqual(Object);
    const i3 = new Ctor3();
    expect(i3).toBeInstanceOf(Ctor3);
    expect(i3).toBeInstanceOf(TestComponent3);

    const i3_2 = new Ctor3({ y: 2 });
    expect(i3_2).toBeInstanceOf(Ctor3);
    expect(i3_2).toBeInstanceOf(TestComponent3);
    expect((i3_2 as TestComponent3).x).toEqual({ y: 2 });
  });
});
