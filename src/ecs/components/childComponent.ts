export default class ChildComponent {
  readonly children: number[];

  constructor({ children }: { children?: number[] } = {}) {
    this.children = children ?? [];
  }
}
