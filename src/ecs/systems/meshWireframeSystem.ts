import type System from './system.ts';
import { type EntityManager, EntityQuery } from '../entities/entityManager.ts';
import DiagnosticsResource from '../resources/diagnosticsResource.ts';
import TransformComponent from '../components/transformComponent.ts';
import MeshComponent from '../components/meshComponent.ts';
import MeshWireframeComponent from '../components/meshWireframeComponent.ts';

export default class MeshWireframeSystem implements System {
  readonly #query = new EntityQuery([MeshComponent, TransformComponent]);

  update(_dt: number, em: EntityManager): void {
    const diagnostics = em.getResource(DiagnosticsResource);
    if (!diagnostics.meshWireframesEnabledDirty) return;

    if (diagnostics.meshWireframesEnabled) {
      for (const e of this.#query.execute(em)) {
        if (!em.getComponentOpt(e, MeshWireframeComponent)) {
          em.addComponent(e, new MeshWireframeComponent());
        }
      }
    } else {
      for (const e of this.#query.execute(em)) {
        em.removeComponent(e, MeshWireframeComponent);
      }
    }

    diagnostics.meshWireframesEnabledDirty = false;
  }
}
