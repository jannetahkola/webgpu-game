import { assertFloat32Array, assertUint32Array } from './asserts.ts';

describe('asserts', () => {
  test('assertFloat32Array', () => {
    expect(() => assertFloat32Array(new Float32Array())).not.toThrowError();
    expect(() => assertFloat32Array(new Uint16Array())).toThrowError();
  });

  test('assertUint32Array', () => {
    expect(() => assertUint32Array(new Uint32Array())).not.toThrowError();
    expect(() => assertUint32Array(new Uint16Array())).toThrowError();
  });
});
