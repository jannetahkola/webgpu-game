import type { TypedArray } from '@gltf-transform/core';

function assertFloat32Array(array: TypedArray | null): Float32Array {
  if (!(array instanceof Float32Array)) {
    throw new Error('array is not Float32Array: ' + array?.constructor.name);
  }
  return array;
}

function isUintArray(array: unknown) {
  return (
    array instanceof Uint8Array ||
    array instanceof Uint16Array ||
    array instanceof Uint32Array
  );
}

function assertUint16Array(array: TypedArray | null): Uint16Array {
  if (!isUintArray(array)) {
    throw new Error('array is not uint: ' + array?.constructor.name);
  }
  const typed = array as Uint8Array | Uint16Array | Uint32Array;
  let max = 0;
  for (const element of typed) {
    if (element > max) max = element;
  }
  if (max > 65535) {
    throw new Error('array exceeds uint16 range: ' + max);
  }
  return array as Uint16Array;
}

export { assertFloat32Array, assertUint16Array, isUintArray };
