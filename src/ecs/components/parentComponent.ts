export default class ParentComponent {
  readonly parent: number;

  constructor({ parent }: { parent: number }) {
    this.parent = parent;
  }
}
