import { assertFloat32Array, assertUint16Array } from './asserts.ts';

describe('asserts', () => {
  test('assertFloat32Array', () => {
    expect(() => assertFloat32Array(new Float32Array())).not.toThrowError();
    expect(() => assertFloat32Array(new Uint16Array())).toThrowError();
  });

  test('assertUint16Array', () => {
    expect(() => assertUint16Array(new Uint8Array())).not.toThrowError();
    expect(() => assertUint16Array(new Uint16Array())).not.toThrowError();
    expect(() => assertUint16Array(new Uint32Array())).not.toThrowError();
    expect(() => assertUint16Array(new Float32Array())).toThrowError(
      'array is not uint: Float32Array'
    );
    expect(() => assertUint16Array(new Uint32Array([65536]))).toThrowError(
      'array exceeds uint16 range'
    );
  });
});
