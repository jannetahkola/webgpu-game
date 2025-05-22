type Class<C> = C extends new (...args: never[]) => object ? C : never;
type Constructor<I = object, A extends unknown[] = unknown[]> = new (
  ...args: A
) => I;

export default class ComponentRegistry {
  static readonly #registry = new Map<string, Constructor>();

  static set<C extends object>(componentClass: Class<C>) {
    this.#registry.set(componentClass.name, componentClass as Constructor);
  }

  static get(name: string) {
    const c = this.#registry.get(name);
    if (!c) throw new Error('No component ' + name);
    return c;
  }

  static registerComponents(modules: Record<string, unknown>) {
    for (const path in modules) {
      const module = modules[path] as Record<string, unknown>;
      for (const [_, value] of Object.entries(module)) {
        if (typeof value !== 'function') continue;
        this.set(value as Constructor);
        console.log(
          'registered component ' + value.name + ' from ' + path + ''
        );
      }
    }
  }
}
