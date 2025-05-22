import { Document, type WebIO } from '@gltf-transform/core';
import { WebGPUStubs } from '../../tests/stubs';
import { GltfManager } from './gltf';

describe('GltfManager', () => {
  const mockGltfDocument = () => {
    const doc = new Document();

    const mat = doc.createMaterial().setName('mock-mat');

    const pos = doc.createAccessor().setArray(new Float32Array([0, 0, 0]));
    const uv = doc.createAccessor().setArray(new Float32Array([0, 0]));
    const normal = doc.createAccessor().setArray(new Float32Array([0, 0, 0]));
    const idx = doc.createAccessor().setArray(new Uint32Array([0]));

    const prim = doc
      .createPrimitive()
      .setName('mock-mesh-1')
      .setAttribute('POSITION', pos)
      .setAttribute('TEXCOORD_0', uv)
      .setAttribute('NORMAL', normal)
      .setIndices(idx)
      .setMaterial(mat);

    const prim2 = doc
      .createPrimitive()
      .setName('mock-mesh-2')
      .setAttribute('POSITION', pos)
      .setAttribute('TEXCOORD_0', uv)
      .setAttribute('NORMAL', normal)
      .setIndices(idx)
      .setMaterial(mat);

    const mesh = doc.createMesh().addPrimitive(prim).addPrimitive(prim2);
    const node = doc.createNode().setName('mock-mesh').setMesh(mesh);
    const scene = doc.createScene().addChild(node);
    doc.getRoot().setDefaultScene(scene);

    return doc;
  };

  it('throws when model not found', () => {
    const manager = new GltfManager();
    expect(() => manager.get('invalid')).toThrowError(
      "Model 'invalid' not found"
    );
  });

  it('throws when mesh not found', () => {
    const manager = new GltfManager();
    expect(() => manager.getMesh('invalid')).toThrowError(
      "Mesh 'invalid' not found"
    );
  });

  it('throws when material not found', () => {
    const manager = new GltfManager();
    expect(() => manager.getMaterial('invalid')).toThrowError(
      "Material 'invalid' not found"
    );
  });

  it('loads gltf', async () => {
    const { device } = WebGPUStubs.createDevice();
    const io = {
      read: vi.fn().mockResolvedValue(mockGltfDocument()),
    } as unknown as WebIO;
    const manager = new GltfManager({ io });

    await manager.loadGltf(device, ['./assets/gltf/rubik_cube/rubik_cube.glb']);
    const model = manager.get('./assets/gltf/rubik_cube/rubik_cube.glb');

    expect(model.meshes.length).toBe(2);
    expect(model.materials.length).toBe(1);

    const mesh = model.meshes[0];
    expect(mesh.ref).toBe(
      '/src/resources/assets/gltf/rubik_cube/rubik_cube.glb#mock-mesh:mock-mesh-1'
    );
    expect(mesh.materialRef).toBe(
      '/src/resources/assets/gltf/rubik_cube/rubik_cube.glb#mock-mat'
    );

    expect(device.createTexture).toHaveBeenCalledOnce(); // default texture
    expect(device.createBuffer).toHaveBeenCalledTimes(9); // 5 on first iteration, then material reused
  });

  // todo test non-default texture loading
});
