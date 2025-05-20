export default class RendererFactory {
  create<T>(RendererType: new () => T): T;
  create<T, Args extends unknown[]>(
    RendererType: new (...args: Args) => T,
    ...args: Args
  ): T;
  create<T, Args extends unknown[]>(
    RendererType: new (...args: Args) => T,
    ...args: Args
  ): T {
    return new RendererType(...args);
  }
}
