import type { TypedArray } from '@gltf-transform/core';

function assertFloat32Array(array: TypedArray | null): Float32Array {
  if (!(array instanceof Float32Array)) {
    throw new Error('array is not Float32Array: ' + array?.constructor.name);
  }
  return array;
}

function assertUint32Array(array: TypedArray | null): Uint32Array {
  if (!(array instanceof Uint32Array)) {
    throw new Error('array is not Uint32Array: ' + array?.constructor.name);
  }
  return array;
}

export { assertFloat32Array, assertUint32Array };
