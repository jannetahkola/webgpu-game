export default class ColliderWireframeComponent {
  vertexBuffer?: GPUBuffer;
  lineIndexBuffer?: GPUBuffer;
  lineIndexCount?: number;

  getVertexBuffer() {
    if (!this.vertexBuffer) throw new Error('Vertex buffer not set');
    return this.vertexBuffer;
  }

  getLineIndexBuffer() {
    if (!this.lineIndexBuffer) throw new Error('Line index buffer not set');
    return this.lineIndexBuffer;
  }

  getLineIndexCount() {
    if (!this.lineIndexCount) throw new Error('Line index count not set');
    return this.lineIndexCount;
  }

  destroy() {
    this.vertexBuffer?.destroy();
    this.lineIndexBuffer?.destroy();
    console.log('wireframe destroyed');
  }
}
