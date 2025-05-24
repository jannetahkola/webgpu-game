export default class ResourceManagerFactory {
  create<T>(ResourceManagerType: new () => T): T;
  create<T, Args extends unknown[]>(
    ResourceManagerType: new (...args: Args) => T,
    ...args: Args
  ): T;
  create<T, Args extends unknown[]>(
    ResourceManagerType: new (...args: Args) => T,
    ...args: Args
  ): T {
    return new ResourceManagerType(...args);
  }
}
