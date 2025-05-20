import RendererFactory from './rendererFactory.ts';

class TestRenderer {}

class TestRendererWithArgs {
  a: number;

  constructor(a: number) {
    this.a = a;
  }
}

// todo proper type tests might be in place

describe('RendererFactory', () => {
  it('creates instance without arguments', () => {
    const f = new RendererFactory();
    const r = f.create(TestRenderer);
    expect(r).not.toBeUndefined();
    expectTypeOf(r).toEqualTypeOf<TestRenderer>();
  });

  it('creates instance with arguments', () => {
    const f = new RendererFactory();
    const r = f.create(TestRendererWithArgs, 0);
    expect(r).not.toBeUndefined();
    expectTypeOf(r).toEqualTypeOf<TestRendererWithArgs>();
    expect(r.a).toBe(0);
  });
});
