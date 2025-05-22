export default class ModelComponent {
  readonly ref: string;

  constructor({ ref }: { ref: string }) {
    this.ref = ref;
  }
}
