export default class DiagnosticsResource {
  meshWireframesEnabled: boolean;
  meshWireframesEnabledDirty = true;

  colliderWireframesEnabled: boolean;
  colliderWireframesEnabledDirty = true;

  constructor({
    meshWireframesEnabled,
    colliderWireframesEnabled,
  }: {
    meshWireframesEnabled?: boolean;
    colliderWireframesEnabled?: boolean;
  } = {}) {
    this.meshWireframesEnabled = meshWireframesEnabled ?? false;
    this.colliderWireframesEnabled = colliderWireframesEnabled ?? false;
  }

  setMeshWireframesEnabled(v: boolean) {
    this.meshWireframesEnabled = v;
    this.meshWireframesEnabledDirty = true;
  }

  setColliderWireframesEnabled(v: boolean) {
    this.colliderWireframesEnabled = v;
    this.colliderWireframesEnabledDirty = true;
  }
}
