import type { TypedArray } from '@gltf-transform/core';

function assertFloat32Array(array: TypedArray | null): Float32Array {
  if (!(array instanceof Float32Array)) {
    throw new Error('array is not Float32Array: ' + array?.constructor.name);
  }
  return array;
}

function assertUint16Array(array: TypedArray | null): Uint16Array {
  if (
    !(array instanceof Uint8Array) &&
    !(array instanceof Uint16Array) &&
    !(array instanceof Uint32Array)
  ) {
    throw new Error('array is not uint: ' + array?.constructor.name);
  }
  if (Math.max(...array) > 65535) {
    throw new Error('array exceeds uint16 range');
  }
  return array as Uint16Array;
}

export { assertFloat32Array, assertUint16Array };
